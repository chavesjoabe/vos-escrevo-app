package com.biblejournal.config;

import com.biblejournal.annotation.UserPericopeAnnotationRepository;
import com.biblejournal.book.Book;
import com.biblejournal.book.BookRepository;
import com.biblejournal.pericope.Pericope;
import com.biblejournal.pericope.PericopeRepository;
import com.biblejournal.pericope.Verse;
import com.biblejournal.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@Startup
@ApplicationScoped
public class BibleSeedLoader {

    private static final Logger LOGGER = Logger.getLogger(BibleSeedLoader.class);
    private static final int BATCH_SIZE = 500;

    private final BookRepository bookRepository;
    private final PericopeRepository pericopeRepository;
    private final UserRepository userRepository;
    private final UserPericopeAnnotationRepository annotationRepository;
    private final ObjectMapper objectMapper;
    private final boolean seedEnabled;
    private final String seedResourcePath;

    @Inject
    public BibleSeedLoader(
            BookRepository bookRepository,
            PericopeRepository pericopeRepository,
            UserRepository userRepository,
            UserPericopeAnnotationRepository annotationRepository,
            ObjectMapper objectMapper,
            @ConfigProperty(name = "bible.seed.enabled", defaultValue = "true") boolean seedEnabled,
            @ConfigProperty(name = "bible.seed.resource-path", defaultValue = "/seed/blivre-bible.json")
            String seedResourcePath
    ) {
        this.bookRepository = bookRepository;
        this.pericopeRepository = pericopeRepository;
        this.userRepository = userRepository;
        this.annotationRepository = annotationRepository;
        this.objectMapper = objectMapper;
        this.seedEnabled = seedEnabled;
        this.seedResourcePath = seedResourcePath;
    }

    @PostConstruct
    void onStart() {
        if (!seedEnabled) {
            LOGGER.info("Bible seed step is disabled (bible.seed.enabled=false).");
            return;
        }
        seedIfEmpty();
    }

    public void seedIfEmpty() {
        long existingBookCount = bookRepository.count();
        long existingPericopeCount = pericopeRepository.count();
        if (existingBookCount == 66 && existingPericopeCount == 1189) {
            LOGGER.infof(
                    "Database already contains %d books and %d chapters in 'commented-bible'. Skipping BLIVRE seed.",
                    existingBookCount,
                    existingPericopeCount
            );
            ensureIndexes();
            return;
        }

        if (existingBookCount > 0 || existingPericopeCount > 0) {
            LOGGER.infof(
                    "Refreshing 'commented-bible' seed data (found %d books, %d chapters; expected 66 books, 1189 chapters)...",
                    existingBookCount,
                    existingPericopeCount
            );
            pericopeRepository.deleteAll();
            bookRepository.deleteAll();
        }

        LOGGER.infof("Seeding BLIVRE (Bíblia Livre) translation from %s...", seedResourcePath);
        try (InputStream inputStream = getClass().getResourceAsStream(seedResourcePath)) {
            if (inputStream == null) {
                throw new IllegalStateException("Seed resource not found at " + seedResourcePath);
            }

            SeedPayload seedPayload = objectMapper.readValue(inputStream, SeedPayload.class);
            List<Book> booksToInsert = new ArrayList<>();
            List<Pericope> pericopesToInsert = new ArrayList<>();

            for (SeedBook seedBook : seedPayload.books()) {
                List<SeedPericope> seedPericopes = seedBook.pericopes() != null
                        ? seedBook.pericopes()
                        : List.of();
                Book book = new Book(
                        seedBook.name(),
                        seedBook.abbreviation(),
                        seedBook.testament(),
                        seedBook.description(),
                        seedBook.orderInTestament(),
                        seedPericopes.size()
                );
                book.id = new ObjectId();
                booksToInsert.add(book);

                for (SeedPericope seedPericope : seedPericopes) {
                    Pericope pericope = new Pericope(
                            book.id,
                            seedPericope.title(),
                            seedPericope.reference(),
                            seedPericope.orderInBook(),
                            seedPericope.verses()
                    );
                    pericope.id = new ObjectId();
                    pericopesToInsert.add(pericope);
                }
            }

            bookRepository.persist(booksToInsert);

            for (int startIndex = 0; startIndex < pericopesToInsert.size(); startIndex += BATCH_SIZE) {
                int endIndex = Math.min(startIndex + BATCH_SIZE, pericopesToInsert.size());
                List<Pericope> batch = pericopesToInsert.subList(startIndex, endIndex);
                pericopeRepository.persist(batch);
            }

            ensureIndexes();

            LOGGER.infof(
                    "Successfully seeded %d books and %d pericopes from %s translation into 'commented-bible'.",
                    booksToInsert.size(),
                    pericopesToInsert.size(),
                    seedPayload.translation()
            );
        } catch (Exception exception) {
            LOGGER.error("Failed to seed BLIVRE Bible data into MongoDB", exception);
            throw new RuntimeException("Failed to seed BLIVRE Bible data", exception);
        }
    }

    private void ensureIndexes() {
        try {
            bookRepository.mongoCollection().createIndex(Indexes.ascending("orderInTestament"));
            pericopeRepository.mongoCollection().createIndex(
                    Indexes.ascending("bookId", "orderInBook")
            );
            userRepository.mongoCollection().createIndex(
                    Indexes.ascending("email"),
                    new IndexOptions().unique(true)
            );
            annotationRepository.mongoCollection().createIndex(
                    Indexes.ascending("userId", "pericopeId"),
                    new IndexOptions().unique(true)
            );
        } catch (Exception exception) {
            LOGGER.warn("Could not create MongoDB indexes", exception);
        }
    }

    public record SeedPayload(String translation, List<SeedBook> books) {
    }

    public record SeedBook(
            String name,
            String abbreviation,
            String testament,
            String description,
            int orderInTestament,
            List<SeedPericope> pericopes
    ) {
    }

    public record SeedPericope(
            String title,
            String reference,
            int orderInBook,
            List<Verse> verses
    ) {
    }
}
