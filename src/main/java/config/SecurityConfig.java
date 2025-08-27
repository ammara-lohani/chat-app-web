package config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;
import entities.User.Role;
import filter.JwtAuthenticationFilter;


@EnableWebSecurity
@Configuration

public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenicationFilter;

    public SecurityConfig(UserDetailsService userDetailsService,JwtAuthenticationFilter jwtAuthenicationFilter ) {
        this.userDetailsService = userDetailsService;
		this.jwtAuthenicationFilter = jwtAuthenicationFilter;
    }
    

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
        .cors(Customizer.withDefaults())
        .sessionManagement(c->
        c.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .csrf(AbstractHttpConfigurer::disable)
          .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(c -> c
            	.requestMatchers("/api/messages/chat/**","/getting/**","/dropdown","/details/**").authenticated()
                .requestMatchers("/user/register").permitAll()
                .requestMatchers("/ws/**", "/app/**", "/topic/**").permitAll()
                .requestMatchers("/user/**","/user").permitAll()
            	.requestMatchers("/user/**").permitAll()
                .requestMatchers("/user/**").authenticated()  
                .requestMatchers("/allmessages").hasRole(Role.ADMIN.name())
                .requestMatchers(HttpMethod.POST, "/login").permitAll()
                .anyRequest().authenticated()
               )
           .addFilterAfter(jwtAuthenicationFilter, UsernamePasswordAuthenticationFilter.class) // Changed to addFilterAfter
            .exceptionHandling(c-> c
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)) // ✅ Actually registers the 401 handler
              .accessDeniedHandler((request, response, accessDeniedException )->
              response.setStatus(HttpStatus.FORBIDDEN.value()))
              );
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(passwordEncoder()); // This uses NoOpPasswordEncoder for plain text
        provider.setUserDetailsService(userDetailsService);
        return provider;
    }

    @Bean
    @SuppressWarnings("deprecation")
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}