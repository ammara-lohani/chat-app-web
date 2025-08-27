package service;


import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import entities.User;
import entities.User.Role;

import java.util.Date;

@Component
@Service
public class JwtService {

	@Value("${jwt.secret}")
	private String secret;
    private final long tokenExpiration = 86400000; // 1 day
    
    public String generateToken( User user ) {
        return Jwts.builder()
                   .subject(user.getId().toString())
                   .claim("email", user.getEmail())
                   .claim("name", user.getName())
                   .claim("role", user.getRole())
                   .issuedAt(new Date())
                   .expiration(new Date(System.currentTimeMillis() +  tokenExpiration))
                   .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
                   .compact();
    }

    public boolean validateToken(String token) {
    	try {
 var claims = getClaims(token);
 
 return  claims.getExpiration().after(new Date());
    	}
    	catch (JwtException ex) {
    		return false;  
    	}
                
    }

	private Claims getClaims(String token) {
		 return Jwts.parser()
		            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
		            .build()
		            .parseSignedClaims(token)
		            .getPayload();
	}

    
    public Long getIdFromToken(String token) {
       return Long.valueOf( getClaims(token).getSubject());
    }
    
    public Role getRoleFromToken(String token) {
        return Role.valueOf(getClaims(token).get("role", String.class));
    }

	

}