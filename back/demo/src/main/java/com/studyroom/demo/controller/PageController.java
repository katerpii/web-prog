package com.studyroom.demo.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;

import com.studyroom.demo.entity.Board;
import com.studyroom.demo.entity.Card;
import com.studyroom.demo.entity.Page;
import com.studyroom.demo.entity.User;
import com.studyroom.demo.repository.*;
import com.studyroom.dto.BoardDto;
import com.studyroom.dto.CardDataDto;
import com.studyroom.dto.CardDto;
import com.studyroom.dto.RenderPageDto;

import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.smartcardio.CardPermission;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PageController {
    private final UserRepository userRepository;
    private final PageRepository pageRepository;
    private final BoardRepository boardRepository;
    private final CardRepository cardRepository;

    // @GetMapping("/user/{id}/page}")
    // public ResponseEntity<?> createUserPage(@PathVariable Integer id, @PathVariable Integer pageId) {
    //     Optional<User> user = userRepository.findById(id);

    //     if (user.isPresent()) {
    //         Optional<Page> pageOptional = pageRepository.findByUser(user.get());
            // Optional<Page> pageOptional = pageRepository.findById(pageId);
            // if (!pageOptional.isPresent()) {
                // User와 연결된 새로운 Page 생성
                // Page page = Page.builder()
                //         .pagename("default-page-name") // 페이지 이름
                //         .githubUrl("https://github.com/") // 예시 GitHub URL
                //         .user(user.get()) // User와 연결
                //         .boards(createBoards()) // Board 생성
                //         .cards(new ArrayList<>()) // 빈 카드 목록
                //         .build();
                
                // Page와 연결된 Board의 page 필드 설정
                // page.getBoards().forEach(board -> board.setPage(page));

                // pageRepository.save(page);

                // RenderPageDto form = RenderPageDto.builder()
                //         .pagename(page.getPagename())
                //         .githubUrl(page.getGithubUrl())
                //         .user(page.getUser())
                //         .boards(page.getBoards())
                //         .cards(page.getCards())
                //         .build();

            //     return ResponseEntity.ok().build();
            // }

            // 이미 존재하는 페이지 반환
            // Page page = pageOptional.get();
            // RenderPageDto form = RenderPageDto.builder()
            //         .pagename(page.getPagename())
            //         .githubUrl(page.getGithubUrl())
            //         .user(page.getUser())
            //         .boards(page.getBoards())
            //         .cards(page.getCards())
            //         .build();
    //         return ResponseEntity.ok().build();
    //     }
    //     return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    // }

    @GetMapping("/user/{id}/page/{pageId}")
    public ResponseEntity<RenderPageDto> getUserPage(@PathVariable Integer id, @PathVariable Integer pageId) {
        Optional<User> user = userRepository.findById(id);

        if (user.isPresent()) {
            Optional<Page> pageOptional = pageRepository.findById(pageId);
            if (pageOptional.isPresent()) {
                Page page = pageOptional.get();

                List<BoardDto> boardDtos = new ArrayList<>();
                for (Board board : page.getBoards()) {
                    List<CardDto> cardDtos = new ArrayList<>();
                    for (Card card : board.getCards()) {
                        cardDtos.add(CardDto.builder()
                            .id(card.getCardId())
                            .name(card.getCardName())
                            .author(card.getAuthor())
                            .startDate(card.getStartDate() != null ? card.getStartDate().toString() : "")
                            .endDate(card.getEndDate() != null ? card.getEndDate().toString() : "")
                            .build());
                    }
                    boardDtos.add(BoardDto.builder()
                        .id(board.getBoradId())
                        .status(board.getStatus())
                        .cards(cardDtos)
                        .build());
                }

                RenderPageDto form = RenderPageDto.builder()
                        .pagename(page.getPagename())
                        .githubUrl(page.getGithubUrl())
                        .user(page.getUser())
                        .boards(boardDtos)
                        .build();
                return ResponseEntity.ok(form);
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }


    public String getMethodName(@RequestParam String param) {
        return new String();
    }
    

    @PostMapping("/api/save")
    public ResponseEntity<?> saveData(@RequestBody CardDataDto data) {
        if (data.getPageId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("pageId is required");
        }
        Optional<Board> boardOpt = boardRepository.findByStatusAndPage_PageId(data.getStatus(), data.getPageId());
        if (boardOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid board status or pageId.");
        }
        Board board = boardOpt.get();
        Card card = Card.builder()
            .cardName(data.getCardName())
            .author(data.getAuthor())
            .startDate(data.getStartDate())
            .endDate(data.getEndDate())
            .board(board)
            .page(board.getPage())
            .build();
        Card saved = cardRepository.save(card);
        return ResponseEntity.ok(Map.of("cardId", saved.getCardId()));
    }

    // private List<Board> createBoards() {
    //     List<Board> boards = new ArrayList<>();
    
    //     // 각 상태에 맞는 Board 생성 및 Page와 연결
    //     boards.add(Board.builder()
    //             .status("Scheduled")  
    //             .build());
    //     boards.add(Board.builder()
    //             .status("In Progress")  
    //             .build());
    //     boards.add(Board.builder()
    //             .status("Done")  
    //             .build());
    
    //     return boards;
    // }

    @PatchMapping("/api/card/{id}/move")
    public ResponseEntity<?> moveCard(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Optional<Card> optionalCard = cardRepository.findById(id);
        if (!optionalCard.isPresent()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Card not found");
        Card card = optionalCard.get();
        String newStatus = (String) body.get("status");
        Integer pageId = null;
        if (body.containsKey("pageId")) {
            Object pageIdObj = body.get("pageId");
            if (pageIdObj instanceof Integer) {
                pageId = (Integer) pageIdObj;
            } else if (pageIdObj instanceof String) {
                try {
                    pageId = Integer.parseInt((String) pageIdObj);
                } catch (NumberFormatException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid pageId format");
                }
            }
        } else if (card.getPage() != null) {
            pageId = card.getPage().getPageId();
        }
        if (pageId == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("pageId is required");
        Optional<Board> newBoardOpt = boardRepository.findByStatusAndPage_PageId(newStatus, pageId);
        if (newBoardOpt.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid board status or pageId");
        Board newBoard = newBoardOpt.get();
        card.setBoard(newBoard);
        cardRepository.save(card);
        return ResponseEntity.ok("Board updated");
    }

    @DeleteMapping("/api/card/{id}")
    public ResponseEntity<?> deleteCard(@PathVariable Integer id) {
        Optional<Card> optionalCard = cardRepository.findById(id);
        if (!optionalCard.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Card not found");
        }

        cardRepository.delete(optionalCard.get());
        return ResponseEntity.ok("Card deleted successfully");
    }

    @GetMapping("/api/cards")
    public ResponseEntity<List<Map<String, Object>>> getAllCards() {
        List<Card> cards = cardRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Card card : cards) {
            Map<String, Object> map = new HashMap<>();
            map.put("cardId", card.getCardId());
            map.put("cardName", card.getCardName());
            map.put("author", card.getAuthor());
            map.put("startDate", card.getStartDate());
            map.put("endDate", card.getEndDate());
            // board가 null일 수 있으니 방어
            String status = card.getBoard() != null ? card.getBoard().getStatus() : "Scheduled";
            map.put("status", status);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
