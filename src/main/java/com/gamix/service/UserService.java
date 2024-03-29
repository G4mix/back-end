package com.gamix.service;

import com.gamix.exceptions.ExceptionBase;
import com.gamix.exceptions.user.UserNotFoundById;
import com.gamix.models.User;
import com.gamix.repositories.UserRepository;
import com.gamix.security.JwtManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;

    public User findUserByToken(String token) throws ExceptionBase {
        return findUserById(JwtManager.getIdFromToken(token));
    }

    public User findUserById(Integer id) throws ExceptionBase {
        return userRepository.findById(id).orElseThrow(UserNotFoundById::new);
    }

    public Optional<User> findByEmail(String email) throws ExceptionBase {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsername(String username) throws ExceptionBase {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public void deleteAccount(Integer id) throws ExceptionBase {
        userRepository.deleteById(id);
    }
}
