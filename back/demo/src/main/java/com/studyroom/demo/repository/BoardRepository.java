package com.studyroom.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.studyroom.demo.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Integer> {
    Board findByStatus(String status);
}
