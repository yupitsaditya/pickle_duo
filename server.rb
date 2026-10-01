require 'webrick'
require 'json'

$state = {
  p1: { y: 160, score: 0, connected: false, char: '👱‍♂️' },
  p2: { y: 160, score: 0, connected: false, char: '👩‍🦰' },
  ball: { x: 400, y: 200, vx: 0, vy: 0, status: 'held', last_hit_by: nil },
  status: 'waiting', 
  server: 'p1' 
}

WIDTH = 800
HEIGHT = 400
PADDLE_H = 80
BALL_R = 10

def award_rally(winner)
  if $state[:server] == winner
    $state[winner.to_sym][:score] += 1
  else
    $state[:server] = winner # Sideout
  end
  
  if $state[:p1][:score] >= 5 || $state[:p2][:score] >= 5
    $state[:status] = 'gameover'
  end
  
  $state[:ball][:status] = 'held'
  $state[:ball][:vx] = 0
  $state[:ball][:vy] = 0
  $state[:ball][:last_hit_by] = nil
end

Thread.new do
  loop do
    sleep 0.016 # ~60 FPS

    if $state[:status] == 'playing'
      b = $state[:ball]
      
      if b[:status] == 'held'
        if $state[:server] == 'p1'
          b[:x] = 40
          b[:y] = $state[:p1][:y] + PADDLE_H / 2
        else
          b[:x] = WIDTH - 40
          b[:y] = $state[:p2][:y] + PADDLE_H / 2
        end
      elsif b[:status] == 'in_play'
        b[:x] += b[:vx]
        b[:y] += b[:vy]

        # Top/Bottom wall collision (Reverted to bouncing to prevent instant-outs)
        if b[:y] <= BALL_R || b[:y] >= HEIGHT - BALL_R
          b[:vy] = -b[:vy]
        end

        # Scoring (Only trigger when ball is completely off-screen to avoid serve bugs)
        if b[:x] < -50
          award_rally('p2')
          next
        elsif b[:x] > WIDTH + 50
          award_rally('p1')
          next
        end

        # Paddle collisions
        if b[:x] - BALL_R <= 30 && b[:y] >= $state[:p1][:y] && b[:y] <= $state[:p1][:y] + PADDLE_H && b[:vx] < 0
          b[:vx] = b[:vx].abs
          b[:vx] *= 1.05
          hit_pos = (b[:y] - $state[:p1][:y]) / PADDLE_H.to_f
          b[:vy] = (hit_pos - 0.5) * 12 # Max vertical speed
          b[:last_hit_by] = 'p1'
        end

        if b[:x] + BALL_R >= WIDTH - 30 && b[:y] >= $state[:p2][:y] && b[:y] <= $state[:p2][:y] + PADDLE_H && b[:vx] > 0
          b[:vx] = -b[:vx].abs
          b[:vx] *= 1.05
          hit_pos = (b[:y] - $state[:p2][:y]) / PADDLE_H.to_f
          b[:vy] = (hit_pos - 0.5) * 12
          b[:last_hit_by] = 'p2'
        end
      end
    end
  end
end

server = WEBrick::HTTPServer.new(Port: 8000, BindAddress: '0.0.0.0')

server.mount_proc '/' do |req, res|
  if req.path == '/' || req.path == '/index.html'
    res.content_type = 'text/html'
    res.body = File.read('./public/index.html')
  elsif req.path == '/style.css'
    res.content_type = 'text/css'
    res.body = File.read('./public/style.css')
  elsif req.path == '/game.js'
    res.content_type = 'application/javascript'
    res.body = File.read('./public/game.js')
  else
    res.status = 404
  end
end

server.mount_proc '/api/state' do |req, res|
  res.content_type = 'application/json'
  res.body = $state.to_json
end

server.mount_proc '/api/join' do |req, res|
  res.content_type = 'application/json'
  if req.request_method == 'POST'
    data = JSON.parse(req.body)
    char = data['char'] || '👱‍♂️'
    
    if !$state[:p1][:connected]
      $state[:p1][:connected] = true
      $state[:p1][:char] = char
      res.body = { role: 'p1' }.to_json
    elsif !$state[:p2][:connected]
      $state[:p2][:connected] = true
      $state[:p2][:char] = char
      $state[:status] = 'playing'
      res.body = { role: 'p2' }.to_json
    else
      res.body = { role: 'spectator' }.to_json
    end
  end
end

server.mount_proc '/api/action' do |req, res|
  if req.request_method == 'POST'
    begin
      data = JSON.parse(req.body)
      role = data['role']
      
      if data['y'] && (role == 'p1' || role == 'p2')
        $state[role.to_sym][:y] = [[data['y'], 0].max, HEIGHT - PADDLE_H].min
      end
      
      if data['serve'] && $state[:server] == role && $state[:ball][:status] == 'held' && $state[:status] == 'playing'
        $state[:ball][:status] = 'in_play'
        $state[:ball][:last_hit_by] = role
        $state[:ball][:vx] = role == 'p1' ? 8 : -8
        $state[:ball][:vy] = rand(-4..4)
      end
      
      if data['reset'] && $state[:status] == 'gameover'
        $state[:p1][:score] = 0
        $state[:p2][:score] = 0
        $state[:status] = 'playing'
        $state[:ball][:status] = 'held'
        $state[:server] = 'p1'
      end
    rescue => e
      puts "Error parsing action: #{e.message}"
    end
  end
  res.status = 200
end

server.mount_proc '/api/hard_reset' do |req, res|
  if req.request_method == 'POST'
    $state = {
      p1: { y: 160, score: 0, connected: false, char: '👱‍♂️' },
      p2: { y: 160, score: 0, connected: false, char: '👩‍🦰' },
      ball: { x: 400, y: 200, vx: 0, vy: 0, status: 'held', last_hit_by: nil },
      status: 'waiting', 
      server: 'p1' 
    }
  end
  res.status = 200
end

trap 'INT' do server.shutdown end
puts "Starting Pickleball server on 0.0.0.0:8000..."
server.start
