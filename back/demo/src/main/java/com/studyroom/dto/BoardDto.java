package com.studyroom.dto;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

import com.studyroom.demo.entity.Board;
import com.studyroom.demo.entity.Card;
import com.studyroom.dto.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BoardDto {
    private Integer id;
    private String status;
    private List<CardDto> cards;

    public static BoardDto from(Board board) {
        List<CardDto> cardDtos = new ArrayList<>();
        for (Card card : board.getCards()) {
            cardDtos.add(CardDto.builder()
                .id(card.getCardId())
                .name(card.getCardName())
                .author(card.getAuthor())
                .startDate(card.getStartDate() != null ? card.getStartDate().toString() : "")
                .endDate(card.getEndDate() != null ? card.getEndDate().toString() : "")
                .status(board.getStatus())
                .build());
        }
        return BoardDto.builder()
            .id(board.getBoradId())
            .status(board.getStatus())
            .cards(cardDtos)
            .build();
    }
}
