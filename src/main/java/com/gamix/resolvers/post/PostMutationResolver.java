package com.gamix.resolvers.post;

import com.gamix.communication.postController.PartialPostInput;
import com.gamix.exceptions.ExceptionBase;
import com.gamix.models.Post;
import com.gamix.security.JwtManager;
import com.gamix.service.PostService;
import graphql.kickstart.tools.GraphQLMutationResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@RequiredArgsConstructor
@Controller
public class PostMutationResolver implements GraphQLMutationResolver {
    private final HttpServletRequest httpServletRequest;
    private final PostService postService;

    @MutationMapping
    Post createPost(@Argument("input") PartialPostInput postInput, @Argument("images") List<Part> images) throws ExceptionBase {
        String token = httpServletRequest.getHeader("Authorization");
        return postService.createPost(JwtManager.getIdFromToken(token), postInput, images);
    }

    @MutationMapping
    Post updatePost(@Argument("postId") Integer postId,
                    @Argument("input") PartialPostInput partialPostInput,
                    @Argument("images") List<Part> images) throws ExceptionBase {
        String token = httpServletRequest.getHeader("Authorization");
        return postService.updatePost(JwtManager.getIdFromToken(token), postId, partialPostInput, images);
    }

    @MutationMapping
    boolean deletePost(@Argument("postId") Integer id) throws ExceptionBase {
        String token = httpServletRequest.getHeader("Authorization");
        return postService.deletePost(JwtManager.getIdFromToken(token), id);
    }
}
