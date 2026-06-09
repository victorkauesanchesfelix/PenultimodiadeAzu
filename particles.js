class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.stars = [];
        this.mouse = { x: null, y: null, radius: 150 };
        
        // Settings
        this.maxParticles = 80;
        this.connectionDistance = 120;
        this.colors = [
            'rgba(168, 85, 247, ', // Purple
            'rgba(59, 130, 246, ',  // Blue
            'rgba(99, 102, 241, '   // Indigo
        ];
        
        this.init();
        this.animate();
        this.registerEvents();
    }
    
    init() {
        this.resizeCanvas();
        this.particles = [];
        this.stars = [];
        
        // Create initial particles
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle(false));
        }

        // Create background stars
        const numStars = window.innerWidth < 768 ? 50 : 150;
        for (let i = 0; i < numStars; i++) {
            this.stars.push(this.createStar());
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Adjust particle counts for screen sizes
        if (window.innerWidth < 768) {
            this.maxParticles = 35;
            this.connectionDistance = 80;
        } else {
            this.maxParticles = 80;
            this.connectionDistance = 120;
        }
    }
    
    createParticle(fromEdge = false) {
        const size = Math.random() * 3.5 + 1;
        let x, y;
        
        if (fromEdge) {
            // Respawn particles from screen edges
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { // Top
                x = Math.random() * this.canvas.width;
                y = -10;
            } else if (edge === 1) { // Right
                x = this.canvas.width + 10;
                y = Math.random() * this.canvas.height;
            } else if (edge === 2) { // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 10;
            } else { // Left
                x = -10;
                y = Math.random() * this.canvas.height;
            }
        } else {
            x = Math.random() * this.canvas.width;
            y = Math.random() * this.canvas.height;
        }
        
        return {
            x,
            y,
            size,
            baseSpeedX: (Math.random() * 0.4 - 0.2),
            baseSpeedY: (Math.random() * 0.4 - 0.2),
            vx: 0,
            vy: 0,
            colorPrefix: this.colors[Math.floor(Math.random() * this.colors.length)],
            alpha: Math.random() * 0.5 + 0.35,
            fadeSpeed: Math.random() * 0.005 + 0.002,
            fadeDirection: Math.random() > 0.5 ? 1 : -1
        };
    }

    createStar() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 1.5 + 0.5,
            baseAlpha: Math.random() * 0.5 + 0.1,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            timeOffset: Math.random() * Math.PI * 2
        };
    }
    
    registerEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.init();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
        
        // Support touch events for mobile
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        });
        
        window.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    drawDots() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Pulsing opacity
            p.alpha += p.fadeSpeed * p.fadeDirection;
            if (p.alpha > 0.85 || p.alpha < 0.2) {
                p.fadeDirection *= -1;
            }
            
            // Base movement
            p.vx = p.baseSpeedX;
            p.vy = p.baseSpeedY;
            
            // Mouse push/pull physics
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.mouse.radius) {
                    // Force pushing particles away from mouse
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    const forceDirectionX = dx / dist;
                    const forceDirectionY = dy / dist;
                    
                    p.vx += forceDirectionX * force * 1.5;
                    p.vy += forceDirectionY * force * 1.5;
                }
            }
            
            p.x += p.vx;
            p.y += p.vy;
            
            // Screen boundary check - wrap around or recreate
            if (p.x < -20 || p.x > this.canvas.width + 20 || p.y < -20 || p.y > this.canvas.height + 20) {
                this.particles[i] = this.createParticle(true);
                continue;
            }
            
            // Draw particle with glow
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `${p.colorPrefix}${p.alpha})`;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `${p.colorPrefix}0.4)`;
            this.ctx.fill();
        }
    }
    
    drawLines() {
        this.ctx.shadowBlur = 0; // Disable shadow glow for line performance
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.connectionDistance) {
                    // Calculate transparency based on distance
                    const alpha = (1 - dist / this.connectionDistance) * 0.15;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    
                    // Create a subtle gradient for connection lines
                    const grad = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    grad.addColorStop(0, `${p1.colorPrefix}${alpha})`);
                    grad.addColorStop(1, `${p2.colorPrefix}${alpha})`);
                    
                    this.ctx.strokeStyle = grad;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawAuraGlow() {
        // Draw soft pulsing light blobs in corners to create deep ambient aesthetic
        const time = Date.now() * 0.0008;
        
        // Purple blob (top left)
        const purpleX = 200 + Math.sin(time) * 100;
        const purpleY = 200 + Math.cos(time * 0.8) * 100;
        const purpleGrad = this.ctx.createRadialGradient(purpleX, purpleY, 0, purpleX, purpleY, 400);
        purpleGrad.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
        purpleGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = purpleGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Blue blob (bottom right)
        const blueX = this.canvas.width - 200 + Math.cos(time * 0.9) * 100;
        const blueY = this.canvas.height - 200 + Math.sin(time * 0.7) * 100;
        const blueGrad = this.ctx.createRadialGradient(blueX, blueY, 0, blueX, blueY, 500);
        blueGrad.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
        blueGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = blueGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawStars() {
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        
        for (let star of this.stars) {
            // Calculate twinkling effect using sine wave
            const alpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed * 100 + star.timeOffset) * 0.3;
            const clampedAlpha = Math.max(0, Math.min(1, alpha));
            
            this.ctx.globalAlpha = clampedAlpha;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render aura gradients
        this.drawAuraGlow();

        // Draw twinkling stars
        this.drawStars();
        
        // Draw network
        this.drawLines();
        this.drawDots();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize system on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem('bg-canvas');
});
