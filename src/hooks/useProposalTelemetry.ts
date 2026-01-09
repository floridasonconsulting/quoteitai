import { useEffect, useRef, useState } from "react";
import { telemetryService } from "@/lib/services/telemetry-service";

export function useProposalTelemetry(
    quoteId: string | undefined,
    currentSectionId: string,
    isEnabled: boolean = true,
    isOwner: boolean = false
) {
    const sessionId = useRef(crypto.randomUUID()).current;
    const lastSectionId = useRef(currentSectionId);
    const startTime = useRef(Date.now());

    useEffect(() => {
        if (!isEnabled || !quoteId) return;

        // Track transition
        const handleTransition = () => {
            const dwellTimeMs = Date.now() - startTime.current;

            // Only track if dwell time is significant (> 1s)
            if (dwellTimeMs > 1000) {
                telemetryService.track({
                    quoteId,
                    sessionId,
                    sectionId: lastSectionId.current,
                    dwellTimeMs,
                    isOwner
                });
            }

            // Reset for new section
            lastSectionId.current = currentSectionId;
            startTime.current = Date.now();
        };

        handleTransition();

        // Secondary cleanup tracking on unmount
        return () => {
            const dwellTimeMs = Date.now() - startTime.current;
            if (dwellTimeMs > 1000) {
                telemetryService.track({
                    quoteId,
                    sessionId,
                    sectionId: currentSectionId,
                    dwellTimeMs,
                    isOwner
                });
            }
            // Defer flush to next tick to avoid blocking navigation
            // This prevents telemetry from interfering with route transitions
            setTimeout(() => telemetryService.flush(), 100);
        };
    }, [currentSectionId, quoteId, isEnabled, isOwner]);
}
