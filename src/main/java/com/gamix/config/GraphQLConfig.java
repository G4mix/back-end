package com.gamix.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;
import com.gamix.resolvers.Comment.CommentMutationResolver;
import com.gamix.resolvers.Comment.CommentQueryResolver;
import com.gamix.resolvers.Comment.CommentResolver;
import com.gamix.resolvers.Like.LikeMutationResolver;
import com.gamix.resolvers.Post.PostMutationResolver;
import com.gamix.resolvers.Post.PostQueryResolver;
import com.gamix.resolvers.Post.PostResolver;
import com.gamix.resolvers.User.UserMutationResolver;
import com.gamix.resolvers.User.UserQueryResolver;
import graphql.GraphQL;
import graphql.kickstart.servlet.apollo.ApolloScalars;
import graphql.kickstart.tools.SchemaParser;
import graphql.kickstart.tools.SchemaParserBuilder;
import graphql.schema.GraphQLScalarType;
import graphql.schema.GraphQLSchema;

@Configuration
public class GraphQLConfig {
        
    @Bean
    public GraphQLScalarType uploadScalar() {
        return ApolloScalars.Upload;
    }

    @Bean
    public GraphQL graphQL(
        UserQueryResolver userQueryResolver, UserMutationResolver userMutationResolver,
        PostResolver postResolver, PostQueryResolver postQueryResolver, PostMutationResolver postMutationResolver,
        CommentResolver commentResolver, CommentQueryResolver commentQueryResolver, CommentMutationResolver commentMutationResolver,
        LikeMutationResolver likeMutationResolver
    ) {
        SchemaParserBuilder schemaParserBuilder = SchemaParser.newParser()
                .file("graphql/schema.graphqls")
                .scalars(uploadScalar())
                .resolvers(
                    userQueryResolver, userMutationResolver, 
                    postResolver, postQueryResolver, postMutationResolver,
                    commentResolver, commentQueryResolver, commentMutationResolver,
                    likeMutationResolver
                );
        
        GraphQLSchema graphQLSchema = schemaParserBuilder.build().makeExecutableSchema();

        return GraphQL.newGraphQL(graphQLSchema).build();
    }

    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurerUpload() {
        return wiringBuilder -> wiringBuilder.scalar(uploadScalar());
    }
}
