package com.biblejournal.pericope;

public record PericopeSummaryResponse(
        String id,
        String bookId,
        String title,
        String reference,
        int orderInBook
) {
    public static PericopeSummaryResponse fromEntity(Pericope pericope) {
        return new PericopeSummaryResponse(
                pericope.id != null ? pericope.id.toHexString() : null,
                pericope.bookId != null ? pericope.bookId.toHexString() : null,
                pericope.title,
                pericope.reference,
                pericope.orderInBook
        );
    }
}
