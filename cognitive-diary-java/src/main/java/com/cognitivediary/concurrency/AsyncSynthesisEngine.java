package com.cognitivediary.concurrency;

import com.cognitivediary.model.Models.JournalAnalysis;
import com.cognitivediary.service.GeminiAiService;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * AsyncSynthesisEngine demonstrating Multithreading & Synchronization.
 * Uses a ThreadPoolExecutor, asynchronous task dispatching, and thread-safe locking.
 */
@Component
public class AsyncSynthesisEngine {

    private final ExecutorService threadPool;
    private final GeminiAiService aiService;
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final AtomicLong totalAnalysesRequested = new AtomicLong(0);
    private final AtomicLong totalAnalysesCompleted = new AtomicLong(0);

    public AsyncSynthesisEngine(GeminiAiService aiService) {
        this.aiService = aiService;
        // Multithreaded worker pool with custom thread naming
        this.threadPool = new ThreadPoolExecutor(
                3,
                8,
                60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(50),
                new ThreadFactory() {
                    private int counter = 0;
                    @Override
                    public synchronized Thread newThread(Runnable r) {
                        return new Thread(r, "SynthesisWorker-" + (++counter));
                    }
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    /**
     * Dispatches journal analysis asynchronously using CompletableFuture and thread pool.
     */
    public CompletableFuture<JournalAnalysis> submitAnalysisTask(String userId, String entryId, String text, String date) {
        totalAnalysesRequested.incrementAndGet();

        return CompletableFuture.supplyAsync(() -> {
            rwLock.readLock().lock();
            try {
                JournalAnalysis analysis = aiService.analyzeEntry(userId, entryId, text, date);
                totalAnalysesCompleted.incrementAndGet();
                return analysis;
            } catch (Exception e) {
                throw new CompletionException("Background analysis task failed", e);
            } finally {
                rwLock.readLock().unlock();
            }
        }, threadPool);
    }

    /**
     * Synchronized method providing real-time multithreading statistics.
     */
    public synchronized String getThreadPoolStatus() {
        if (threadPool instanceof ThreadPoolExecutor tpe) {
            return String.format(
                "Pool [active: %d, core: %d, max: %d, queueSize: %d] | Analyses [requested: %d, completed: %d]",
                tpe.getActiveCount(),
                tpe.getCorePoolSize(),
                tpe.getMaximumPoolSize(),
                tpe.getQueue().size(),
                totalAnalysesRequested.get(),
                totalAnalysesCompleted.get()
            );
        }
        return "Thread pool active";
    }

    public void shutdown() {
        threadPool.shutdown();
    }
}
