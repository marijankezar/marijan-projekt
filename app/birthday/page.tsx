'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './birthday.module.css';

export default function BirthdayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Array<{left: string, top: string, delay: string}>>([]);

  useEffect(() => {
    // Generate stars on client side only
    const generatedStars = Array.from({ length: 50 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const confettiColors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84'];

    class Confetto {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedY: number = 0;
      speedX: number = 0;
      rotation: number = 0;
      rotationSpeed: number = 0;
      color: string = '';
      shape: 'rect' | 'circle' = 'rect';

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height - canvas!.height;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.y > canvas!.height) {
          this.reset();
        }
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rotation * Math.PI / 180);
        ctx!.fillStyle = this.color;

        if (this.shape === 'rect') {
          ctx!.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();
      }
    }

    const confetti: Confetto[] = [];
    for (let i = 0; i < 100; i++) {
      confetti.push(new Confetto());
    }

    let animationId: number;
    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetti.forEach(c => {
        c.update();
        c.draw();
      });
      animationId = requestAnimationFrame(animateConfetti);
    };
    animateConfetti();

    // Firework function
    const createFirework = (x: number, y: number) => {
      const colors = ['#ff0', '#f00', '#0ff', '#f0f', '#0f0', '#ff6b6b', '#feca57'];
      const particles = 30;

      for (let i = 0; i < particles; i++) {
        const firework = document.createElement('div');
        firework.style.position = 'fixed';
        firework.style.width = '5px';
        firework.style.height = '5px';
        firework.style.borderRadius = '50%';
        firework.style.pointerEvents = 'none';
        firework.style.zIndex = '1001';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        firework.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = (i / particles) * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;

        firework.style.boxShadow = `0 0 6px 2px ${firework.style.background}`;

        document.body.appendChild(firework);

        firework.animate([
          { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: '0' }
        ], {
          duration: 1000 + Math.random() * 500,
          easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
        }).onfinish = () => firework.remove();
      }
    };

    const randomFirework = () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight / 2);
      createFirework(x, y);
    };

    // Initial fireworks
    const initialTimeout = setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(randomFirework, i * 300);
      }
    }, 500);

    // Random fireworks interval
    const fireworkInterval = setInterval(randomFirework, 2000);

    // Click handler
    const handleClick = (e: MouseEvent) => {
      createFirework(e.clientX, e.clientY);
    };
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
      clearInterval(fireworkInterval);
      clearTimeout(initialTimeout);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className={styles.birthdayPage}>
      <canvas ref={canvasRef} className={styles.confettiCanvas} />

      <div className={styles.stars}>
        {stars.map((star, i) => (
          <div
            key={i}
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay
            }}
          />
        ))}
      </div>

      <div className={`${styles.partyPopper} ${styles.partyPopperLeft}`}>🎉</div>
      <div className={`${styles.partyPopper} ${styles.partyPopperRight}`}>🎉</div>

      <div className={styles.birthdayContainer}>
        <div className={styles.cakeContainer}>
          <div className={styles.cake}>🎂</div>
        </div>

       {/*  <h1 className={styles.title}>Alles Gute zum Geburtstag</h1> */}
        <h1 className={styles.title}>Vse najboljše za rojstni dan!</h1>

        <h2 className={styles.name}>Tomi</h2>

        <div className={styles.decorations}>
          <span className={styles.balloon}>🎈</span>
          <span className={styles.balloon}>🎈</span>
          <span className={styles.balloon}>🎈</span>
          <span className={styles.balloon}>🎈</span>
          <span className={styles.balloon}>🎈</span>
        </div>

        <div className={styles.message}>
          
🌟 Dragi Tomi, 🎉🎂



iskrene čestitke ob tvojem 40. rojstnem dnevu! 🎉
Želim ti lep dan v krogu tvoje čudovite družine – žene in treh otrok.

Zame si odličen sodelavec in zelo cenim najino dolgoletno in uspešno sodelovanje. Poleg dela pa si tudi izjemen glasbenik (bas kitara, klavir in še več) ter pravi mojster koktajlov 🍸.

Vse najboljše, veliko zdravja, sreče in uspeha – ostani takšen, kot si!

Lep pozdrav

        </div>

        <Link href="/" className={styles.backLink}>
          ← Zurück
        </Link>
      </div>
    </div>
  );
}
