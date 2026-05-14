import confetti from 'canvas-confetti'

type Variant = 'win' | 'sides' | 'stars' | 'cashback'

function fireWin() {
  // Burst central grande
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.55 },
    colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#96CEB4', '#DDA0DD'],
    scalar: 1.2,
    ticks: 300,
  })
  // Chuva dos lados
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 } })
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } })
  }, 150)
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 70,  spread: 45, origin: { x: 0, y: 0.5 } })
    confetti({ particleCount: 40, angle: 110, spread: 45, origin: { x: 1, y: 0.5 } })
  }, 350)
}

function fireSides() {
  confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#26ccff','#a25afd','#ff5e7e','#88ff5a','#fcff42','#ffa62d'] })
  confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#26ccff','#a25afd','#ff5e7e','#88ff5a','#fcff42','#ffa62d'] })
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60,  spread: 45, origin: { x: 0 } })
    confetti({ particleCount: 50, angle: 120, spread: 45, origin: { x: 1 } })
  }, 250)
}

function fireStars() {
  const defaults = { spread: 360, ticks: 100, gravity: 0, decay: 0.94, startVelocity: 20 }
  const shoot = () => {
    confetti({ ...defaults, particleCount: 30, scalar: 1.2, shapes: ['star'], colors: ['#FFE400','#FFBD00','#E89400'] })
    confetti({ ...defaults, particleCount: 20, scalar: 0.75, shapes: ['circle'], colors: ['#ffffff','#FFE400'] })
  }
  shoot()
  setTimeout(shoot, 100)
  setTimeout(shoot, 200)
}

function fireCashback() {
  // Verde e dourado - tema cashback
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10B981', '#34D399', '#6EE7B7', '#FFD700', '#FCD34D'],
    scalar: 1.1,
    ticks: 250,
  })
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60,  spread: 50, origin: { x: 0 }, colors: ['#10B981','#FFD700'] })
    confetti({ particleCount: 50, angle: 120, spread: 50, origin: { x: 1 }, colors: ['#10B981','#FFD700'] })
  }, 200)
}

export function useConfetti() {
  const fire = (variant: Variant = 'win') => {
    if (typeof window === 'undefined') return
    switch (variant) {
      case 'win':      fireWin();      break
      case 'sides':    fireSides();    break
      case 'stars':    fireStars();    break
      case 'cashback': fireCashback(); break
    }
  }
  return { fire }
}
