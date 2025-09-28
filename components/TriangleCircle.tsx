'use client'
import React, { useEffect } from "react";
import * as THREE from 'three';
// import Stats from 'three/addons/libs/stats.module.js';


const TriangleCircle = () => {


  useEffect(() => {
    let container: HTMLElement | null;
    // let stats: Stats;


    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;


    let mouseX = 0, mouseY = 0;


    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;


    init();


    function init() {


      container = document.getElementById('container');


      camera = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 1800;


      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf1f9ff);


      const light = new THREE.AmbientLight(0xffffff, 3);
      light.position.set(0, 0, 1);
      scene.add(light);


      // shadow
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;


      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D context');
      }
      const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
      gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,1)');


      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);


      const radius = 200;


      const geometry = new THREE.IcosahedronGeometry(radius, 1);


      // Create a transparent material for the faces
      const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });


      // Create a white material for the wireframe
      const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x14967f,
        transparent: false,
        opacity: 0.3,
        linewidth: 0.3
      });


      const mesh = new THREE.Mesh(geometry, faceMaterial);
      const edges = new THREE.EdgesGeometry(geometry);
      const wireframe = new THREE.LineSegments(edges, wireframeMaterial);


      mesh.add(wireframe);


      scene.add(mesh);


      const rotationSpeed = 0.003;


      // Update camera position to create a spinning effect
      camera.position.x = Math.sin(Date.now() * rotationSpeed) * radius;
      camera.position.y = Math.cos(Date.now() * rotationSpeed) * radius;


      camera.lookAt(scene.position);


      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);


      if (!container) {
        throw new Error('Container is not defined');
      }
      container.appendChild(renderer.domElement);


      document.addEventListener('mousemove', onDocumentMouseMove);


      window.addEventListener('resize', onWindowResize);
    }


    function onWindowResize() {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;


      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();


      renderer.setSize(window.innerWidth, window.innerHeight);
    }


    function onDocumentMouseMove(event: MouseEvent) {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    }


    function animate() {
      render();
    }


    function render() {
      camera.position.x += (mouseX - camera.position.x) * 0.002;
      camera.position.y += (- mouseY - camera.position.y) * 0.002;


      camera.lookAt(scene.position);


      renderer.render(scene, camera);
    }


    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('resize', onWindowResize);


      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };


  }, []);


  return (
    <div
      id="container"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    />
  );
};


export default TriangleCircle;