package com.gamix.service;

import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.gamix.exceptions.ExceptionBase;
import com.gamix.exceptions.authentication.InvalidAccessToken;
import com.gamix.exceptions.user.UserAlreadyExistsWithThisUsername;
import com.gamix.exceptions.user.UserNotFoundByEmail;
import com.gamix.exceptions.user.UserNotFoundById;
import com.gamix.exceptions.user.UserNotFoundByToken;
import com.gamix.exceptions.user.UserNotFoundByUsername;
import com.gamix.interfaces.services.UserServiceInterface;
import com.gamix.models.User;
import com.gamix.records.inputs.UserController.PartialUserInput;
import com.gamix.repositories.UserRepository;
import com.gamix.security.JwtManager;
import com.gamix.utils.ParameterValidator;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;

@Service
public class UserService implements UserServiceInterface {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtManager jwtManager;

    @Override
    public List<User> findAllUsers(int skip, int limit) {
        Pageable page = PageRequest.of(skip, limit);
        Page<User> users = userRepository.findAll(page);

        return users.getContent();
    }

    @Override
    public User findUserByToken(String accessToken) throws ExceptionBase {
        Claims claims = jwtManager.getTokenClaims(accessToken);
        Optional<User> optionalUser =
                userRepository.findById(Integer.parseInt(claims.getSubject()));
        return optionalUser.orElseThrow(() -> new UserNotFoundByToken());
    }

    @Override
    public User findUserById(Integer id) throws ExceptionBase {
        Optional<User> optionalUser = userRepository.findById(id);
        return optionalUser.orElseThrow(() -> new UserNotFoundById());
    }

    @Override
    public User findUserByEmail(String email) throws ExceptionBase {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        return optionalUser.orElseThrow(() -> new UserNotFoundByEmail());
    }


    @Override
    public User findUserByUsername(String username) throws ExceptionBase {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        return optionalUser.orElseThrow(() -> new UserNotFoundByUsername());
    }

    @Override
    public User updateUser(String accessToken, PartialUserInput userInput) throws ExceptionBase {
        User userToUpdate = findUserByToken(accessToken);
        
        if (userInput.username() != null) {
            if (userRepository.findByUsername(userInput.username()) != null) {
                throw new UserAlreadyExistsWithThisUsername();
            }

            ParameterValidator.validateUsername(userInput.username());
            
            userToUpdate.setUsername(userInput.username());
        }
        if (userInput.icon() != null) {
            userToUpdate.setIcon(userInput.icon());
        }

        return userRepository.save(userToUpdate);
    }

    @Override
    @Transactional
    public boolean deleteAccount(String accessToken) throws ExceptionBase {
        if (!jwtManager.validate(accessToken))
            throw new InvalidAccessToken();

        Claims claims = jwtManager.getTokenClaims(accessToken);
        Integer id = Integer.parseInt(claims.getSubject());

        if (userRepository.existsById(id))
            userRepository.deleteById(id);

        return true;
    }

    @Override
    public User createUser(String username, String email, String icon) {
        User user = new User().setUsername(username).setEmail(email).setIcon(icon);

        return userRepository.save(user);
    }
}
