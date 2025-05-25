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
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;

import com.studyroom.demo.entity.Board;
import com.studyroom.demo.entity.Card;
import com.studyroom.demo.entity.Page;
import com.studyroom.demo.entity.User;
import com.studyroom.demo.repository.*;
import com.studyroom.dto.CardDataDto;
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

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PageController {
    private final UserRepository userRepository;
    private final PageRepository pageRepository;
    private final BoardRepository boardRepository;
    private final CardRepository cardRepository;

    @GetMapping("/user/{id}/page")
    public ResponseEntity<RenderPageDto> getUserPage(@PathVariable Integer id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            Optional<Page> pageOptional = pageRepository.findByUser(user.get());

            if (!pageOptional.isPresent()) {
                // User와 연결된 새로운 Page 생성
                Page page = Page.builder()
                        .pagename("default-page-name") // 페이지 이름
                        .githubUrl("https://github.com/") // 예시 GitHub URL
                        .user(user.get()) // User와 연결
                        .boards(createBoards()) // Board 생성
                        .cards(new ArrayList<>()) // 빈 카드 목록
                        .build();
                
                // Page와 연결된 Board의 page 필드 설정
                page.getBoards().forEach(board -> board.setPage(page));

                pageRepository.save(page);

                RenderPageDto form = RenderPageDto.builder()
                        .pagename(page.getPagename())
                        .githubUrl(page.getGithubUrl())
                        .user(page.getUser())
                        .boards(page.getBoards())
                        .cards(page.getCards())
                        .build();

                return ResponseEntity.ok(form);
            }

            // 이미 존재하는 페이지 반환
            Page page = pageOptional.get();
            RenderPageDto form = RenderPageDto.builder()
                    .pagename(page.getPagename())
                    .githubUrl(page.getGithubUrl())
                    .user(page.getUser())
                    .boards(page.getBoards())
                    .cards(page.getCards())
                    .build();
            return ResponseEntity.ok(form);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    @PostMapping("/api/save")
    public ResponseEntity<?> saveData(@RequestBody CardDataDto data) {
        Board board = boardRepository.findByStatus(data.getStatus());
        
        if (board == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid board status.");
        
        Card card = Card.builder()
            .cardName(data.getCardName())
            .author(data.getAuthor())
            .startDate(data.getStartDate())
            .endDate(data.getEndDate())
            .board(board)
            .page(board.getPage())
            .build();
        
        Card saved = cardRepository.save(card);

        // cardId 반환
        return ResponseEntity.ok(Map.of("cardId", saved.getCardId()));
    }

    private List<Board> createBoards() {
        List<Board> boards = new ArrayList<>();
    
        // 각 상태에 맞는 Board 생성 및 Page와 연결
        boards.add(Board.builder()
                .status("Scheduled")  
                .build());
        boards.add(Board.builder()
                .status("In Progress")  
                .build());
        boards.add(Board.builder()
                .status("Done")  
                .build());
    
        return boards;
    }

    @PatchMapping("/api/card/{id}/move")
    public ResponseEntity<?> moveCard(@PathVariable Integer id, @RequestBody Map<String, String> body) {
    Optional<Card> optionalCard = cardRepository.findById(id);
    if (!optionalCard.isPresent()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Card not found");

    Card card = optionalCard.get();
    String newStatus = body.get("status");
    Board newBoard = boardRepository.findByStatus(newStatus);
    if (newBoard == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid board status");

    card.setBoard(newBoard);
    cardRepository.save(card);
    return ResponseEntity.ok("Board updated");
}

}
