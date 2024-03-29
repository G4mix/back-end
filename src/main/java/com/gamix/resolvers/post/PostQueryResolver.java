package com.gamix.resolvers.post;

import com.gamix.exceptions.ExceptionBase;
import com.gamix.models.Post;
import com.gamix.service.PostService;
import com.gamix.utils.SortUtils;
import graphql.kickstart.tools.GraphQLQueryResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@RequiredArgsConstructor
@Controller
public class PostQueryResolver implements GraphQLQueryResolver {
    private final PostService postService;

    @QueryMapping
    List<Post> findAllPosts(@Argument("skip") int skip, @Argument("limit") int limit) {
        Pageable page = PageRequest.of(skip, limit, SortUtils.sortByUpdatedAtOrCreatedAt());
        return postService.findAll(page);
    }

    @QueryMapping
    Post findPostById(@Argument Integer id) throws ExceptionBase {
        return postService.findPostById(id);
    }

    @QueryMapping
    Post findPostByTitle(@Argument String title) throws ExceptionBase {
        return postService.findPostByTitle(title);
    }
}
