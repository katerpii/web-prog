package com.studyroom.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.studyroom.demo.entity.Card;

public interface CardRepository extends JpaRepository<Card, Integer>{
    
}
