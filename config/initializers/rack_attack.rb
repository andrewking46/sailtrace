class Rack::Attack
  throttle('req/ip', limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  # Throttle login attempts for a given email parameter to 5 requests per minute
  # Return the email as a discriminator on POST /api/v1/login requests
  throttle('logins/email', limit: 10, period: 60.seconds) do |req|
    if req.path == '/api/v1/login' && req.post?
      req.params['email'].to_s.downcase.gsub(/\s+/, '')
    end
  end

  # Throttle login attempts for a given IP to 20 requests per minute
  throttle('logins/ip', limit: 20, period: 60.seconds) do |req|
    if req.path == '/api/v1/login' && req.post?
      req.ip
    end
  end
end
