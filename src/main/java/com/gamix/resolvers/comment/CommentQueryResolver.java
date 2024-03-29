package com.gamix.resolvers.comment;

import com.gamix.models.Comment;
import com.gamix.service.CommentService;
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
public class CommentQueryResolver implements GraphQLQueryResolver {
    private final CommentService commentService;

    @QueryMapping
    List<Comment> findAllCommentsOfAPost(
            @Argument("postId") int postId,
            @Argument("skip") int skip,
            @Argument("limit") int limit
    ) {
        Pageable page = PageRequest.of(skip, limit, SortUtils.sortByUpdatedAtOrCreatedAt());
        return commentService.findAllCommentsOfAPost(postId, page);
    }
}
