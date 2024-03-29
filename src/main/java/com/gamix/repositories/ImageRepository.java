package com.gamix.repositories;

import com.gamix.models.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {

    @Query("SELECT COUNT(i) FROM Image i WHERE i.src = :src")
    int countBySrc(String src);
}
