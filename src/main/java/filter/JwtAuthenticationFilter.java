package filter;

import java.io.IOException;
import service.JwtService;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService; 
    }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean skip = path.startsWith("/user/") || 
        		path.startsWith("/ws/") ||
        		//path.startsWith("/api/messages/chat/") ||
        		//path.startsWith("/api")   ||
        		//path.startsWith("/message")  ||
         		 path.contains("/websocket") ||     // Add this
                 path.contains("/sockjs") ||
                // path.contains("/chat")  ||
                       path.equals("/user") || 
                       (path.equals("/login") && "POST".equals(request.getMethod()));
        System.out.println("Path: " + path + ", Skip filter: " + skip);
        return skip;
    }
   
    @Override
	public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("JWT Filter executing for: " + request.getRequestURI());
        var authheader = request.getHeader("Authorization");

        if (authheader == null || !authheader.startsWith("Bearer ")) {
        	filterChain.doFilter(request,response);
        	return;
        }
        
        var token = authheader.replace("Bearer ", "");
        if (!jwtService.validateToken(token)) {
        	filterChain.doFilter(request, response);
        	return;
        }
        
        var role= jwtService.getRoleFromToken(token);
        var authenication = new UsernamePasswordAuthenticationToken(
        		jwtService.getIdFromToken(token),
        		null,
        		List.of(new SimpleGrantedAuthority("ROLE_"+role))
        		);
        authenication.setDetails(
        		new WebAuthenticationDetailsSource().buildDetails(request)
        		);
           SecurityContextHolder.getContext().setAuthentication(authenication);
           filterChain.doFilter(request, response);
           
    } 

    }


