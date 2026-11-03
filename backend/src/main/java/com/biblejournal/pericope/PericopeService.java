package com.biblejournal.pericope;

import com.biblejournal.annotation.UserPericopeAnnotation;
import com.biblejournal.annotation.UserPericopeAnnotationRepository;
import com.biblejournal.auth.UnauthorizedAccessException;
import com.biblejournal.book.Book;
import com.biblejournal.book.BookService;
import com.biblejournal.stroke.Stroke;
import com.biblejournal.stroke.StrokeRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.bson.types.ObjectId;

@ApplicationScoped
public class PericopeService {

    private static final List<DailyVerseResponse> INSPIRATIONAL_VERSES = List.of(
            new DailyVerseResponse(
                    "Salmos",
                    "Sl",
                    119,
                    105,
                    "Salmos 119:105",
                    "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.",
                    "Direção & Sabedoria"
            ),
            new DailyVerseResponse(
                    "Salmos",
                    "Sl",
                    23,
                    1,
                    "Salmos 23:1-2",
                    "O Senhor é o meu pastor, nada me faltará. Ele me faz repousar em pastos verdejantes e guia-me mansamente a águas tranquilas.",
                    "Confiança & Descanso"
            ),
            new DailyVerseResponse(
                    "Josué",
                    "Js",
                    1,
                    9,
                    "Josué 1:9",
                    "Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.",
                    "Coragem & Presença"
            ),
            new DailyVerseResponse(
                    "Isaías",
                    "Is",
                    40,
                    31,
                    "Isaías 40:31",
                    "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.",
                    "Esperança & Renovação"
            ),
            new DailyVerseResponse(
                    "João",
                    "Jo",
                    8,
                    12,
                    "João 8:12",
                    "Falou-lhes, pois, Jesus outra vez, dizendo: Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida.",
                    "Luz & Vida"
            ),
            new DailyVerseResponse(
                    "Romanos",
                    "Rm",
                    8,
                    28,
                    "Romanos 8:28",
                    "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados por seu decreto.",
                    "Propósito & Fé"
            ),
            new DailyVerseResponse(
                    "Filipenses",
                    "Fp",
                    4,
                    6,
                    "Filipenses 4:6-7",
                    "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.",
                    "Paz & Oração"
            ),
            new DailyVerseResponse(
                    "Provérbios",
                    "Pv",
                    3,
                    5,
                    "Provérbios 3:5-6",
                    "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
                    "Sabedoria & Confiança"
            ),
            new DailyVerseResponse(
                    "Mateus",
                    "Mt",
                    11,
                    28,
                    "Mateus 11:28",
                    "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.",
                    "Consolo & Graça"
            ),
            new DailyVerseResponse(
                    "Salmos",
                    "Sl",
                    46,
                    1,
                    "Salmos 46:1",
                    "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.",
                    "Refúgio & Fortaleza"
            ),
            new DailyVerseResponse(
                    "Lamentações",
                    "Lm",
                    3,
                    22,
                    "Lamentações 3:22-23",
                    "As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; novas são cada manhã; grande é a tua fidelidade.",
                    "Fidelidade & Graça"
            ),
            new DailyVerseResponse(
                    "Hebreus",
                    "Hb",
                    11,
                    1,
                    "Hebreus 11:1",
                    "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.",
                    "Fé & Esperança"
            )
    );

    private final PericopeRepository pericopeRepository;
    private final UserPericopeAnnotationRepository annotationRepository;
    private final BookService bookService;

    @Inject
    public PericopeService(
            PericopeRepository pericopeRepository,
            UserPericopeAnnotationRepository annotationRepository,
            BookService bookService
    ) {
        this.pericopeRepository = pericopeRepository;
        this.annotationRepository = annotationRepository;
        this.bookService = bookService;
    }

    public List<PericopeSummaryResponse> listPericopesByBookId(String bookId) {
        Book book = bookService.findBookEntityOrThrow(bookId);
        return pericopeRepository.findByBookIdOrdered(book.id)
                .stream()
                .map(PericopeSummaryResponse::fromEntity)
                .toList();
    }

    public PericopeResponse getPericopeByIdForUser(String pericopeId, String userId) {
        Pericope pericope = findPericopeEntityOrThrow(pericopeId);
        ObjectId userObjectId = parseUserObjectIdOrThrow(userId);
        UserPericopeAnnotation annotation = annotationRepository
                .findByUserIdAndPericopeId(userObjectId, pericope.id)
                .orElse(null);
        return PericopeResponse.fromEntity(pericope, annotation);
    }

    public PericopeResponse replaceHighlightStrokesForUser(
            String pericopeId,
            String userId,
            List<StrokeRequest> strokeRequests
    ) {
        Pericope pericope = findPericopeEntityOrThrow(pericopeId);
        ObjectId userObjectId = parseUserObjectIdOrThrow(userId);

        List<Stroke> updatedHighlightStrokes = strokeRequests.stream()
                .map(strokeRequest -> strokeRequest.toEntity("marker"))
                .toList();

        UserPericopeAnnotation annotation = annotationRepository
                .findByUserIdAndPericopeId(userObjectId, pericope.id)
                .orElse(null);

        if (annotation == null) {
            annotation = new UserPericopeAnnotation(
                    userObjectId,
                    pericope.id,
                    updatedHighlightStrokes,
                    new CommentPage(LocalDate.now().toString(), new ArrayList<>())
            );
            annotation.id = new ObjectId();
            annotationRepository.persist(annotation);
        } else {
            annotation.highlightStrokes = updatedHighlightStrokes;
            annotation.updatedAt = Instant.now().toString();
            annotationRepository.update(annotation);
        }

        return PericopeResponse.fromEntity(pericope, annotation);
    }

    public PericopeResponse replaceCommentPageForUser(
            String pericopeId,
            String userId,
            CommentPageRequest commentPageRequest
    ) {
        Pericope pericope = findPericopeEntityOrThrow(pericopeId);
        ObjectId userObjectId = parseUserObjectIdOrThrow(userId);

        UserPericopeAnnotation annotation = annotationRepository
                .findByUserIdAndPericopeId(userObjectId, pericope.id)
                .orElse(null);

        CommentPage updatedCommentPage = commentPageRequest.toEntity();

        if (annotation == null) {
            annotation = new UserPericopeAnnotation(
                    userObjectId,
                    pericope.id,
                    new ArrayList<>(),
                    updatedCommentPage
            );
            annotation.id = new ObjectId();
            annotationRepository.persist(annotation);
        } else {
            annotation.commentPage = updatedCommentPage;
            annotation.updatedAt = Instant.now().toString();
            annotationRepository.update(annotation);
        }

        return PericopeResponse.fromEntity(pericope, annotation);
    }

    public DailyVerseResponse getRandomInspirationalVerse() {
        long epochDay = LocalDate.now().toEpochDay();
        int dailyIndex = (int) Math.floorMod(epochDay * 31L + 7L, INSPIRATIONAL_VERSES.size());
        return INSPIRATIONAL_VERSES.get(dailyIndex);
    }

    private ObjectId parseUserObjectIdOrThrow(String userId) {
        if (userId == null || !ObjectId.isValid(userId)) {
            throw new UnauthorizedAccessException("Authenticated user identifier is invalid.");
        }
        return new ObjectId(userId);
    }

    private Pericope findPericopeEntityOrThrow(String pericopeId) {
        if (pericopeId == null || !ObjectId.isValid(pericopeId)) {
            throw new PericopeNotFoundException(String.valueOf(pericopeId));
        }
        ObjectId pericopeObjectId = new ObjectId(pericopeId);
        Pericope pericope = pericopeRepository.findById(pericopeObjectId);
        if (pericope == null) {
            throw new PericopeNotFoundException(pericopeId);
        }
        return pericope;
    }
}
