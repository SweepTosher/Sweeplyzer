window.aggregateAllRuns = function (allChunks, totalSims, maxTurns, deckSize) {
    var allRuns = [];
    var globalIdx = 0;
    for (var ci = 0; ci < allChunks.length; ci++) {
        var chunk = allChunks[ci];
        for (var ri = 0; ri < chunk.runs.length; ri++) {
            allRuns.push(Object.assign({}, chunk.runs[ri], { _idx: globalIdx++ }));
        }
    }
    var n = allRuns.length;
    var allStats = [[], [], [], [], []];
    for (var i = 0; i < 5; i++) allStats[i] = allRuns.map(function (r) { return r.finalStats[i]; });
    var allSP = allRuns.map(function (r) { return r.skillPoints; });
    var avgStats = {
        speed: allStats[0].reduce(function (a, b) { return a + b; }, 0) / n,
        stamina: allStats[1].reduce(function (a, b) { return a + b; }, 0) / n,
        power: allStats[2].reduce(function (a, b) { return a + b; }, 0) / n,
        guts: allStats[3].reduce(function (a, b) { return a + b; }, 0) / n,
        wisdom: allStats[4].reduce(function (a, b) { return a + b; }, 0) / n
    };
    var calcDist = function (arr) {
        arr.sort(function (a, b) { return a - b; });
        var mean = arr.reduce(function (a, b) { return a + b; }, 0) / n;
        var variance = arr.reduce(function (s, x) { return s + Math.pow(x - mean, 2); }, 0) / n;
        return {
            min: arr[0],
            max: arr[n - 1],
            mean: mean,
            std: Math.sqrt(variance),
            p25: arr[Math.floor(n * 0.25)],
            p50: arr[Math.floor(n * 0.50)],
            p75: arr[Math.floor(n * 0.75)]
        };
    };
    var distStats = {
        speed: calcDist(allStats[0].slice()),
        stamina: calcDist(allStats[1].slice()),
        power: calcDist(allStats[2].slice()),
        guts: calcDist(allStats[3].slice()),
        wisdom: calcDist(allStats[4].slice()),
        sp: calcDist(allSP.slice())
    };
    var peakIdx = 0, peakTotal = -1;
    for (var i = 0; i < allRuns.length; i++) {
        var total = allRuns[i].finalStats[0] + allRuns[i].finalStats[1] + allRuns[i].finalStats[2] + allRuns[i].finalStats[3] + allRuns[i].finalStats[4] + allRuns[i].skillPoints / 2;
        if (total > peakTotal) { peakTotal = total; peakIdx = i; }
    }
    var peakRun = {
        speed: allRuns[peakIdx].finalStats[0],
        stamina: allRuns[peakIdx].finalStats[1],
        power: allRuns[peakIdx].finalStats[2],
        guts: allRuns[peakIdx].finalStats[3],
        wisdom: allRuns[peakIdx].finalStats[4],
        sp: allRuns[peakIdx].skillPoints,
        total: peakTotal,
        run_index: allRuns[peakIdx]._idx + 1
    };
    var avgSP = allSP.reduce(function (a, b) { return a + b; }, 0) / n;
    var avgTrainingCounts = [0, 1, 2, 3, 4].map(function (i) { return allRuns.reduce(function (a, r) { return a + r.trainingCounts[i]; }, 0) / n; });
    var avgRest = allRuns.reduce(function (a, r) { return a + r.restCounts; }, 0) / n;
    var avgMedic = allRuns.reduce(function (a, r) { return a + r.medicCounts; }, 0) / n;
    var avgTrip = allRuns.reduce(function (a, r) { return a + r.tripCounts; }, 0) / n;
    var avgRace = allRuns.reduce(function (a, r) { return a + r.raceCounts; }, 0) / n;
    var avgFailures = allRuns.reduce(function (a, r) { return a + r.totalFailures; }, 0) / n;
    var totalTraining = avgTrainingCounts.reduce(function (a, b) { return a + b; }, 0);
    var totalNonTraining = avgRest + avgMedic + avgTrip + avgRace;
    var maxTurnHist = Math.max.apply(null, allRuns.map(function (r) { return r.statHistory ? r.statHistory.length : 0; }));
    var avgStatHistory = [];
    var avgFacilityLevels = [];
    var avgFacilityPresses = [];
    for (var t = 0; t < maxTurnHist; t++) {
        var turnStats = allRuns.filter(function (r) { return r.statHistory && t < r.statHistory.length; }).map(function (r) { return r.statHistory[t]; });
        if (turnStats.length > 0) avgStatHistory.push({
            speed: turnStats.reduce(function (s, r) { return s + r[0]; }, 0) / turnStats.length,
            stamina: turnStats.reduce(function (s, r) { return s + r[1]; }, 0) / turnStats.length,
            power: turnStats.reduce(function (s, r) { return s + r[2]; }, 0) / turnStats.length,
            guts: turnStats.reduce(function (s, r) { return s + r[3]; }, 0) / turnStats.length,
            wits: turnStats.reduce(function (s, r) { return s + r[4]; }, 0) / turnStats.length
        });
        var turnFacLvl = allRuns.filter(function (r) { return r.facilityLevelsTimeline && t < r.facilityLevelsTimeline.length; }).map(function (r) { return r.facilityLevelsTimeline[t]; });
        if (turnFacLvl.length > 0) avgFacilityLevels.push({
            speed: turnFacLvl.reduce(function (s, r) { return s + (r ? Math.floor(r[0] / 4) : 0); }, 0) / turnFacLvl.length,
            stamina: turnFacLvl.reduce(function (s, r) { return s + (r ? Math.floor(r[1] / 4) : 0); }, 0) / turnFacLvl.length,
            power: turnFacLvl.reduce(function (s, r) { return s + (r ? Math.floor(r[2] / 4) : 0); }, 0) / turnFacLvl.length,
            guts: turnFacLvl.reduce(function (s, r) { return s + (r ? Math.floor(r[3] / 4) : 0); }, 0) / turnFacLvl.length,
            wits: turnFacLvl.reduce(function (s, r) { return s + (r ? Math.floor(r[4] / 4) : 0); }, 0) / turnFacLvl.length
        });
        var turnFacPrs = allRuns.filter(function (r) { return r.trainingCountsTimeline && t < r.trainingCountsTimeline.length; }).map(function (r) { return r.trainingCountsTimeline[t]; });
        if (turnFacPrs.length > 0) avgFacilityPresses.push({
            speed: turnFacPrs.reduce(function (s, r) { return s + (r ? r[0] : 0); }, 0) / turnFacPrs.length,
            stamina: turnFacPrs.reduce(function (s, r) { return s + (r ? r[1] : 0); }, 0) / turnFacPrs.length,
            power: turnFacPrs.reduce(function (s, r) { return s + (r ? r[2] : 0); }, 0) / turnFacPrs.length,
            guts: turnFacPrs.reduce(function (s, r) { return s + (r ? r[3] : 0); }, 0) / turnFacPrs.length,
            wits: turnFacPrs.reduce(function (s, r) { return s + (r ? r[4] : 0); }, 0) / turnFacPrs.length
        });
    }
    var spHistory = [];
    for (var t = 0; t < maxTurnHist; t++) {
        var turnSP = allRuns.filter(function (r) { return r.statHistory && t < r.statHistory.length; }).map(function (r) { return r.spHistory[t] || 0; });
        if (turnSP.length > 0) spHistory.push(turnSP.reduce(function (a, b) { return a + b; }, 0) / turnSP.length);
    }
    var avgCardPresses = [];
    if (allRuns[0] && allRuns[0].cardPressesByFacility) {
        for (var f = 0; f < 5; f++) {
            avgCardPresses.push(allRuns[0].cardPressesByFacility[f].map(function (_, i) {
                return allRuns.reduce(function (a, r) { return a + r.cardPressesByFacility[f][i]; }, 0) / n;
            }));
        }
    }
    var avgCumulativeCardAppearancesTimeline = [];
    for (var t = 0; t < maxTurnHist; t++) {
        var turnData = allRuns.filter(function (r) { return r.cumulativeCardAppearancesTimeline && t < r.cumulativeCardAppearancesTimeline.length; });
        if (turnData.length > 0) {
            var facilityArr = [];
            for (var f = 0; f < 5; f++) {
                facilityArr.push(turnData[0].cumulativeCardAppearancesTimeline[t][f].map(function (_, i) {
                    return turnData.reduce(function (a, r) { return a + (r.cumulativeCardAppearancesTimeline[t] ? r.cumulativeCardAppearancesTimeline[t][f][i] : 0); }, 0) / turnData.length;
                }));
            }
            avgCumulativeCardAppearancesTimeline.push(facilityArr);
        }
    }
    var avgOperationCountsTimeline = [];
    for (var t = 0; t < maxTurnHist; t++) {
        var turnData = allRuns.filter(function (r) { return r.operationCountsTimeline && t < r.operationCountsTimeline.length; });
        if (turnData.length > 0) avgOperationCountsTimeline.push([
            turnData.reduce(function (a, r) { return a + r.operationCountsTimeline[t][0]; }, 0) / turnData.length,
            turnData.reduce(function (a, r) { return a + r.operationCountsTimeline[t][1]; }, 0) / turnData.length,
            turnData.reduce(function (a, r) { return a + r.operationCountsTimeline[t][2]; }, 0) / turnData.length,
            turnData.reduce(function (a, r) { return a + r.operationCountsTimeline[t][3]; }, 0) / turnData.length
        ]);
    }
    return {
        num_simulations: totalSims,
        max_turns: maxTurns,
        avg_stats: avgStats,
        dist_stats: distStats,
        peak_run: peakRun,
        avg_skill_points: avgSP,
        avg_training_counts: avgTrainingCounts,
        avg_rest: avgRest,
        avg_medic: avgMedic,
        avg_trip: avgTrip,
        avg_race: avgRace,
        avg_failures: avgFailures,
        total_training_turns: totalTraining,
        total_non_training_turns: totalNonTraining,
        total_events_triggered: allRuns.reduce(function (a, r) { return a + r.eventsTriggered; }, 0),
        deck_size: deckSize,
        timeline: {
            stat_history: avgStatHistory,
            facility_levels: avgFacilityLevels,
            facility_presses: avgFacilityPresses,
            sp_history: spHistory,
            operation_counts_timeline: avgOperationCountsTimeline,
            card_presses_timeline: avgCumulativeCardAppearancesTimeline
        },
        avg_card_presses: avgCardPresses
    };
};

window.runSimPool = function (config) {
    var deckData = config.deckData;
    var cardsData = config.cardsData;
    var uniqueEffectsData = config.uniqueEffectsData;
    var options = config.options;
    var onProgress = config.onProgress;
    var onComplete = config.onComplete;
    var totalSims = options.numSimulations;
    var numWorkers = navigator.hardwareConcurrency || 4;
    var simsPerWorker = Math.ceil(totalSims / numWorkers);
    var partialResults = [];
    var workers = [];
    var completed = 0;
    var workersDone = 0;
    var allDone = false;

    var createWorkers = function () {
        for (var i = 0; i < numWorkers; i++) {
            var offset = i * simsPerWorker;
            var count = Math.min(simsPerWorker, totalSims - offset);
            if (count <= 0) break;

            var worker = new Worker(config.workerPath || 'js/sim/worker.js');
            workers.push(worker);
        }
    };

    var initWorker = function (worker, idx) {
        return new Promise(function (resolve) {
            var offset = idx * simsPerWorker;
            var count = Math.min(simsPerWorker, totalSims - offset);

            var readyHandler = function (e) {
                if (e.data.type === 'ready') {
                    worker.removeEventListener('message', readyHandler);
                    resolve();
                }
            };
            worker.addEventListener('message', readyHandler);

            worker.postMessage({
                type: 'init',
                data: {
                    deckData: deckData,
                    cardsData: cardsData,
                    uniqueEffectsData: uniqueEffectsData,
                    options: {
                        numSimulations: count,
                        maxTurns: options.maxTurns,
                        raceSchedule: options.raceSchedule,
                        statBonus: options.statBonus,
                        startingStats: options.startingStats,
                        confident: options.confident
                    }
                }
            });
        });
    };

    var runWorker = function (worker, idx) {
        var offset = idx * simsPerWorker;
        var count = Math.min(simsPerWorker, totalSims - offset);
        worker.postMessage({ type: 'run', data: { offset: offset, count: count } });
    };

    var attachResultHandler = function (worker) {
        worker.onmessage = function (e) {
            if (e.data.type === 'ready') return;
            if (e.data.type === 'result') {
                partialResults.push(e.data.data);
                completed += e.data.data.count;
                workersDone++;
                onProgress(completed, totalSims, workersDone);

                if (!allDone && workersDone >= workers.length) {
                    allDone = true;
                    var result = window.aggregateAllRuns(partialResults, totalSims, options.maxTurns, deckData.length);
                    for (var w = 0; w < workers.length; w++) workers[w].terminate();
                    onComplete(result);
                }
            }
        };
    };

    createWorkers();

    var initPromises = workers.map(function (w, i) { return initWorker(w, i); });

    Promise.all(initPromises).then(function () {
        for (var i = 0; i < workers.length; i++) {
            attachResultHandler(workers[i]);
            runWorker(workers[i], i);
        }
    });
};

window.runRankPool = function (config) {
    var candidates = config.candidates;
    var cardsData = config.cardsData;
    var uniqueEffectsData = config.uniqueEffectsData;
    var onCardDone = config.onCardDone;
    var onAllDone = config.onAllDone;
    var total = candidates.length;
    var completed = 0;
    var allDone = false;
    var numWorkers = Math.min(candidates.length, 2);
    var workers = [];
    var nextCandidateIdx = 0;

    for (var i = 0; i < numWorkers; i++) {
        var worker = new Worker(config.workerPath || 'js/sim/worker.js');
        workers.push(worker);
    }

    var processNext = function(worker) {
        if (nextCandidateIdx >= candidates.length) return false;
        var idx = nextCandidateIdx++;
        var candidate = candidates[idx];
        worker.currentIdx = idx;
        worker.postMessage({
            type: 'init',
            data: {
                deckData: candidate.deckData,
                cardsData: cardsData,
                uniqueEffectsData: uniqueEffectsData,
                options: candidate.options,
                cardId: candidate.cardId,
                cardLb: candidate.cardLb
            }
        });
        return true;
    };

    var scheduleRun = function(worker) {
        var idx = worker.currentIdx;
        if (idx === undefined) return;
        var candidate = candidates[idx];
        worker.postMessage({
            type: 'run',
            data: { offset: 0, count: candidate.options.numSimulations, max_turns: candidate.options.maxTurns }
        });
    };

    workers.forEach(function(worker) {
        worker.onmessage = function(e) {
            if (e.data.type === 'ready') {
                scheduleRun(worker);
                return;
            }
            if (e.data.type === 'result') {
                var idx = worker.currentIdx;
                var data = e.data.data;
                var result = window.aggregateAllRuns([data], data.count, candidates[idx].options.maxTurns, candidates[idx].deckData.length);
                var avgTotal = result.avg_stats.speed + result.avg_stats.stamina + result.avg_stats.power + result.avg_stats.guts + result.avg_stats.wisdom + result.avg_skill_points / 2;
                var cardResult = {
                    cardId: candidates[idx].cardId,
                    cardLb: candidates[idx].cardLb,
                    avg_stats: result.avg_stats,
                    avg_skill_points: result.avg_skill_points,
                    avg_total: avgTotal
                };
                completed++;
                onCardDone(cardResult, completed, total);
                if (nextCandidateIdx < candidates.length) {
                    processNext(worker);
                } else if (completed >= total && !allDone) {
                    allDone = true;
                    workers.forEach(function(w) { w.terminate(); });
                    onAllDone();
                }
            }
        };
    });

    workers.forEach(function(worker) {
        processNext(worker);
    });
};
