package com.gamix.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
@Entity
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false)
    private String src;

    @Column(nullable = false)
    private Integer width;

    @Column(nullable = false)
    private Integer height;
}
