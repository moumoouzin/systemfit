import fs from 'fs';
import { createCanvas } from 'canvas';

function criarIcone(tamanho) {
  const canvas = createCanvas(tamanho, tamanho);
  const ctx = canvas.getContext('2d');
  
  // Fundo roxo
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(0, 0, tamanho, tamanho);
  
  // Círculo branco
  ctx.fillStyle = 'white';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(tamanho/2, tamanho/2, tamanho/3, 0, 2 * Math.PI);
  ctx.fill();
  
  // Quadrado roxo no centro
  ctx.fillStyle = '#8b5cf6';
  ctx.globalAlpha = 1;
  const quadradoTamanho = tamanho/4;
  ctx.fillRect(tamanho/2 - quadradoTamanho/2, tamanho/2 - quadradoTamanho/2, quadradoTamanho, quadradoTamanho);
  
  // Círculo branco pequeno
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(tamanho/2, tamanho/2, tamanho/24, 0, 2 * Math.PI);
  ctx.fill();
  
  // Linhas brancas (símbolo de fitness)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = tamanho/48;
  ctx.lineCap = 'round';
  
  // Linha vertical
  ctx.beginPath();
  ctx.moveTo(tamanho/2, tamanho/2 - tamanho/6);
  ctx.lineTo(tamanho/2, tamanho/2 + tamanho/6);
  ctx.stroke();
  
  // Linha horizontal
  ctx.beginPath();
  ctx.moveTo(tamanho/2 - tamanho/6, tamanho/2);
  ctx.lineTo(tamanho/2 + tamanho/6, tamanho/2);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

// Criar ícones
try {
  const icon192 = criarIcone(192);
  const icon512 = criarIcone(512);
  
  fs.writeFileSync('public/pwa-192x192.png', icon192);
  fs.writeFileSync('public/pwa-512x512.png', icon512);
  
  console.log('✅ Ícones PNG criados com sucesso!');
  console.log('- public/pwa-192x192.png');
  console.log('- public/pwa-512x512.png');
} catch (error) {
  console.error('❌ Erro ao criar ícones:', error.message);
  console.log('💡 Instale o canvas: npm install canvas');
} 