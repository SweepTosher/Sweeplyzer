import logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)

from flask import Flask, jsonify, send_from_directory, request, Response
import json
import sys
import os
import math
import multiprocessing as mp
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sim.engine import SimulationEngine
from sim.unique_effects import parse_unique_effect

app = Flask(__name__, static_folder='web')
app.logger.disabled = True

worker_raw_cards = None
worker_unique_effects = None

def pool_initializer(cards_json, ue_json):
    global worker_raw_cards, worker_unique_effects
    worker_raw_cards = json.loads(cards_json)
    ue_list = json.loads(ue_json)
    worker_unique_effects = {item['id']: parse_unique_effect(item) for item in ue_list}

def run_batch_sims(args):
    deck, max_turns, race_schedule, stat_bonus, starting_stats, batch_size = args
    engine = SimulationEngine(
        deck, batch_size, max_turns,
        race_schedule=race_schedule, stat_bonus=stat_bonus, starting_stats=starting_stats,
        raw_cards_data=worker_raw_cards, preloaded_unique_effects=worker_unique_effects,
    )
    out = []
    for _ in range(batch_size):
        r = engine.simulate_single()
        out.append({
            'final_stats': r.final_stats, 'skill_points': r.skill_points,
            'turns_completed': r.turns_completed, 'training_counts': r.training_counts,
            'rest_counts': r.rest_counts, 'medic_counts': r.medic_counts,
            'trip_counts': r.trip_counts, 'race_counts': r.race_counts,
            'total_failures': r.total_failures, 'events_triggered': r.events_triggered,
        })
    return out

def run_single_card_rank(args):
    deck_index, deck, num_sims, max_turns, race_schedule, stat_bonus, starting_stats = args
    engine = SimulationEngine(
        deck, num_sims, max_turns,
        race_schedule=race_schedule, stat_bonus=stat_bonus, starting_stats=starting_stats,
        raw_cards_data=worker_raw_cards, preloaded_unique_effects=worker_unique_effects,
    )
    stats_acc = [0] * 5
    sp_acc = 0
    for _ in range(num_sims):
        r = engine.simulate_single()
        for i in range(5):
            stats_acc[i] += r.final_stats[i]
        sp_acc += r.skill_points
    avg_stats = [s / num_sims for s in stats_acc]
    avg_sp    = sp_acc / num_sims
    return deck_index, avg_stats, avg_sp

def sanitize(obj):
    if isinstance(obj, float):
        return None if not math.isfinite(obj) else obj
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return obj

def safe_json_dumps(obj):
    return json.dumps(sanitize(obj))

pool = None
pool_lock = threading.Lock()

def get_pool():
    global pool
    with pool_lock:
        if pool is None:
            ctx = mp.get_context('spawn')
            with open('data/cards.json', encoding='utf-8') as f:
                cards_json = f.read()
            with open('data/unique_effects.json', encoding='utf-8') as f:
                ue_json = f.read()
            pool = ctx.Pool(
                processes=max(1, mp.cpu_count() - 1),
                initializer=pool_initializer,
                initargs=(cards_json, ue_json),
            )
    return pool

def summarise(results, num_simulations, max_turns, deck):
    n = len(results)
    all_stats = [[r['final_stats'][i] for r in results] for i in range(5)]
    all_sp = [r['skill_points'] for r in results]
    avg_stats = {k: sum(v)/n for k, v in zip(['speed','stamina','power','guts','wisdom'], all_stats)}
    def calc_dist(arr):
        arr.sort()
        mean = sum(arr) / n
        variance = sum((x - mean)**2 for x in arr) / n
        return {'min': arr[0], 'max': arr[-1], 'mean': mean, 'std': variance**0.5,
                'p25': arr[int(n*.25)], 'p50': arr[int(n*.50)], 'p75': arr[int(n*.75)]}
    dist_stats = {k: calc_dist(v) for k, v in zip(['speed','stamina','power','guts','wisdom'], all_stats)}
    dist_stats['sp'] = calc_dist(all_sp)
    peak_idx, peak_total = max(enumerate(results), key=lambda ir: sum(ir[1]['final_stats']) + ir[1]['skill_points']/2)
    peak_run = {
        'speed':   results[peak_idx]['final_stats'][0],
        'stamina': results[peak_idx]['final_stats'][1],
        'power':   results[peak_idx]['final_stats'][2],
        'guts':    results[peak_idx]['final_stats'][3],
        'wisdom':  results[peak_idx]['final_stats'][4],
        'sp':      results[peak_idx]['skill_points'],
        'total':   peak_total,
        'run_index': peak_idx + 1,
    }
    avg_sp             = sum(all_sp) / n
    avg_training_counts = [sum(r['training_counts'][i] for r in results)/n for i in range(5)]
    avg_rest   = sum(r['rest_counts']  for r in results) / n
    avg_medic  = sum(r['medic_counts'] for r in results) / n
    avg_trip   = sum(r['trip_counts']  for r in results) / n
    avg_race   = sum(r['race_counts']  for r in results) / n
    avg_failures = sum(r['total_failures'] for r in results) / n
    return {
        'num_simulations': num_simulations, 'max_turns': max_turns,
        'avg_stats': avg_stats, 'dist_stats': dist_stats, 'peak_run': peak_run,
        'avg_skill_points': avg_sp, 'avg_training_counts': avg_training_counts,
        'avg_rest': avg_rest, 'avg_medic': avg_medic, 'avg_trip': avg_trip,
        'avg_race': avg_race, 'avg_failures': avg_failures,
        'total_training_turns': sum(avg_training_counts),
        'total_non_training_turns': avg_rest + avg_medic + avg_trip + avg_race,
        'total_events_triggered': sum(r['events_triggered'] for r in results),
        'deck_size': len(deck),
    }

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
        num_simulations = min(1111, max(1, data.get('num_simulations', 11)))
        max_turns       = min(78,   max(20, data.get('max_turns', 72)))
        race_schedule   = data.get('race_schedule', [])
        stat_bonus      = data.get('stat_bonus', [0, 0, 0, 0, 0])
        starting_stats  = data.get('starting_stats', [88, 88, 88, 88, 88])
        num_cpus   = max(1, mp.cpu_count() - 1)
        batch_size = max(1, num_simulations // num_cpus)
        batch_args = []
        i = 0
        while i < num_simulations:
            actual = min(batch_size, num_simulations - i)
            batch_args.append((deck, max_turns, race_schedule, stat_bonus, starting_stats, actual))
            i += actual
        def generate():
            results = []
            for batch_results in get_pool().imap_unordered(run_batch_sims, batch_args):
                results.extend(batch_results)
                yield "data: " + safe_json_dumps({'progress': len(results), 'total': num_simulations}) + "\n\n"
            final = summarise(results, num_simulations, max_turns, deck)
            yield "data: " + safe_json_dumps({'done': True, 'result': final}) + "\n\n"
        return Response(generate(), mimetype='text/event-stream')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rank_cards', methods=['POST'])
def rank_cards():
    try:
        data = request.get_json()
        if not data or 'candidates' not in data:
            return jsonify({'error': 'Missing candidates'}), 400
        candidates     = data['candidates']
        base_deck      = data.get('base_deck', [])
        num_sims       = min(111, max(1, data.get('num_simulations', 11)))
        max_turns      = min(78,  max(20, data.get('max_turns', 72)))
        race_schedule  = data.get('race_schedule', [])
        stat_bonus     = data.get('stat_bonus', [0, 0, 0, 0, 0])
        starting_stats = data.get('starting_stats', [88, 88, 88, 88, 88])
        total  = len(candidates)
        ranked = [None] * total
        task_args = [
            (i, base_deck + [c], num_sims, max_turns, race_schedule, stat_bonus, starting_stats)
            for i, c in enumerate(candidates)
        ]
        def generate():
            completed = 0
            for deck_index, avg_stats, avg_sp in get_pool().imap_unordered(run_single_card_rank, task_args):
                ranked[deck_index] = {
                    'card_id':   candidates[deck_index]['card_id'],
                    'lb':        candidates[deck_index].get('lb', 4),
                    'avg_total': sum(avg_stats) + avg_sp / 2,
                    'avg_stats': avg_stats,
                    'avg_sp':    avg_sp,
                }
                completed += 1
                yield "data: " + safe_json_dumps({'progress': completed, 'total': total}) + "\n\n"
            ranked_sorted = sorted([r for r in ranked if r], key=lambda x: x['avg_total'], reverse=True)
            yield "data: " + safe_json_dumps({'done': True, 'ranked': ranked_sorted}) + "\n\n"
        return Response(generate(), mimetype='text/event-stream')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    mp.freeze_support()
    print('http://127.0.0.1:5000')
    app.run(host='127.0.0.1', port=5000)