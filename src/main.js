import { initScene } from './scene.js';

const app = document.getElementById('app');
const scene = await initScene({ container: app });
scene.start();
