package com.studyroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

import com.studyroom.demo.entity.Board;
import com.studyroom.demo.entity.Card;
import com.studyroom.demo.entity.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardDataDto {
    private String cardName;
    private String author;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer pageId;
}
