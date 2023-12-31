package com.gamix.security;

import java.util.Date;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.gamix.enums.ExpirationTime;
import com.gamix.enums.Role;
import com.gamix.exceptions.authentication.TokenClaimsException;
import com.gamix.interfaces.security.JwtManagerInterface;
import com.gamix.models.User;
import com.gamix.records.returns.security.JwtTokens;
import com.gamix.repositories.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Component
public class JwtManager implements JwtManagerInterface {

    @Autowired
    private UserRepository userRepository;

    @Override
    public Claims getTokenClaims(String token) throws TokenClaimsException {
        try {
            return Jwts.parser().setSigningKey(System.getenv("JWT_SIGNING_KEY_SECRET"))
                    .parseClaimsJws(token).getBody();
        } catch (Exception e) {
            throw new TokenClaimsException();
        }
    }

    @Override
    public boolean validate(String token) throws TokenClaimsException {
        Claims body = getTokenClaims(token);

        Date expirationDate = body.getExpiration();
        Date currentDate = new Date();

        Optional<User> userOptional = userRepository.findById(Integer.parseInt(body.getSubject()));

        boolean isExpired = expirationDate != null && expirationDate.before(currentDate);
        boolean invalidUser = !userOptional.isPresent();
        boolean invalidPasswordUser = false;
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            invalidPasswordUser = user.getPasswordUser() != null && !body.get("password")
                    .toString().equals(user.getPasswordUser().getPassword());
        }

        if (isExpired || invalidUser || invalidPasswordUser)
            return false;

        return true;
    }

    @Override
    public JwtTokens generateJwtTokens(Integer id, String password, boolean rememberMe) {
        String accessToken = generateToken(id, password, rememberMe, ExpirationTime.ACCESS_TOKEN);
        String refreshToken = generateToken(id, password, rememberMe,
                rememberMe ? ExpirationTime.REMEMBER_ME : ExpirationTime.REFRESH_TOKEN);

        return new JwtTokens(accessToken, refreshToken, rememberMe);
    }

    private String generateToken(Integer id, String password, boolean rememberMe,
            ExpirationTime expirationTime) {
        Claims claims = Jwts.claims().setSubject(id.toString());
        claims.put("rememberMe", rememberMe);
        claims.put("role", Role.USER.toString());
        claims.put("password", password);

        Date expirationDate = new Date(System.currentTimeMillis() + expirationTime.getValue());

        return Jwts.builder().setClaims(claims).setExpiration(expirationDate)
                .signWith(SignatureAlgorithm.HS512, System.getenv("JWT_SIGNING_KEY_SECRET")).compact();
    }
}
