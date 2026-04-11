import logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)

from flask import Flask, jsonify, send_from_directory, request, Response
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sim.engine import run_simulation, SimulationEngine

app = Flask(__name__, static_folder='web')
app.logger.disabled = True


@app.route('/')
def index():
    return send_from_directory('web', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('web', path)


@app.route('/api/cards')
def get_cards():
    with open('data/cards.json', encoding='utf-8') as f:
        cards = json.load(f)
    return jsonify(cards)


@app.route('/api/simulate', methods=['POST'])
def simulate():
    try:
        data = request.get_json()

        if not data or 'deck' not in data:
            return jsonify({'error': 'Missing deck parameter'}), 400

        deck = data['deck']
        if not isinstance(deck, list) or len(deck) == 0:
            return jsonify({'error': 'Deck must be a non-empty list'}), 400

        if len(deck) > 6:
            return jsonify({'error': 'Deck cannot have more than 6 cards'}), 400

        num_simulations = data.get('num_simulations', 11)
        max_turns = data.get('max_turns', 72)
        race_schedule = data.get('race_schedule', [])
        stat_bonus = data.get('stat_bonus', [0, 0, 0, 0, 0])
        starting_stats = data.get('starting_stats', [88, 88, 88, 88, 88])

        num_simulations = min(1111, max(1, num_simulations))
        max_turns = min(78, max(20, max_turns))

        engine = SimulationEngine(deck, num_simulations, max_turns, race_schedule=race_schedule,
                                  stat_bonus=stat_bonus, starting_stats=starting_stats)

        def generate():
            results = []

            for i in range(num_simulations):
                result = engine.simulate_single()
                results.append({
                    'final_stats': result.final_stats,
                    'skill_points': result.skill_points,
                    'turns_completed': result.turns_completed,
                    'training_counts': result.training_counts,
                    'rest_counts': result.rest_counts,
                    'medic_counts': result.medic_counts,
                    'trip_counts': result.trip_counts,
                    'race_counts': result.race_counts,
                    'total_failures': result.total_failures,
                    'events_triggered': result.events_triggered,
                })
                yield f"data: {json.dumps({'progress': i + 1, 'total': num_simulations})}\n\n"

            n = len(results)
            all_stats = [[r['final_stats'][i] for r in results] for i in range(5)]
            all_sp = [r['skill_points'] for r in results]

            avg_stats = {k: sum(v) / n for k, v in zip(['speed', 'stamina', 'power', 'guts', 'wisdom'], all_stats)}

            def calc_dist(arr):
                arr.sort()
                mean = sum(arr) / n
                variance = sum((x - mean) ** 2 for x in arr) / n
                return {'min': arr[0], 'max': arr[-1], 'mean': mean, 'std': variance ** 0.5,
                        'p25': arr[int(n * 0.25)], 'p50': arr[int(n * 0.50)], 'p75': arr[int(n * 0.75)]}

            dist_stats = {k: calc_dist(v) for k, v in zip(['speed', 'stamina', 'power', 'guts', 'wisdom'], all_stats)}
            dist_stats['sp'] = calc_dist(all_sp)

            peak_idx, peak_total = max(enumerate(results), key=lambda i_r: sum(i_r[1]['final_stats']) + i_r[1]['skill_points'] / 2)
            peak_run = {
                'speed': results[peak_idx]['final_stats'][0],
                'stamina': results[peak_idx]['final_stats'][1],
                'power': results[peak_idx]['final_stats'][2],
                'guts': results[peak_idx]['final_stats'][3],
                'wisdom': results[peak_idx]['final_stats'][4],
                'sp': results[peak_idx]['skill_points'],
                'total': peak_total,
                'run_index': peak_idx + 1,
            }

            avg_skill_points = sum(all_sp) / n
            avg_training_counts = [sum(r['training_counts'][i] for r in results) / n for i in range(5)]
            avg_rest = sum(r['rest_counts'] for r in results) / n
            avg_medic = sum(r['medic_counts'] for r in results) / n
            avg_trip = sum(r['trip_counts'] for r in results) / n
            avg_race = sum(r['race_counts'] for r in results) / n
            avg_failures = sum(r['total_failures'] for r in results) / n

            final_result = {
                'num_simulations': num_simulations, 'max_turns': max_turns, 'avg_stats': avg_stats,
                'dist_stats': dist_stats, 'peak_run': peak_run, 'avg_skill_points': avg_skill_points,
                'avg_training_counts': avg_training_counts, 'avg_rest': avg_rest, 'avg_medic': avg_medic,
                'avg_trip': avg_trip, 'avg_race': avg_race, 'avg_failures': avg_failures,
                'total_training_turns': sum(avg_training_counts),
                'total_non_training_turns': avg_rest + avg_medic + avg_trip + avg_race,
                'total_events_triggered': sum(r['events_triggered'] for r in results),
                'deck_size': len(deck),
            }
            yield f"data: {json.dumps({'done': True, 'result': final_result})}\n\n"

        return Response(generate(), mimetype='text/event-stream')

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print('http://127.0.0.1:5000')
    app.run(host='127.0.0.1', port=5000)
