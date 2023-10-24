import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'


import {RGBShiftShader} from 'three/examples/jsm/shaders/RGBShiftShader'
import {DotScreenShader} from 'three/examples/jsm/shaders/DotScreenShader'


import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'

import {CustomPass} from './CustomPass'

import t1 from './1.jpg'
import t2 from './2.jpg'
import t3 from './3.jpg'

// import { getProject } from 'theatre/core'

// import studio from '@theatre/studio'


// studio.initialize()
 

// const proj  = getProject(
// 	'First project'
// )

// const sheet = proj.sheet(
// 	'Scene'
// )


// const distortion = sheet.object(
// 	'Distortion',
// 	{
// 		foo: 0,
// 		bar: true,
// 		baz: 'A string'
// 	}
// )


export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		this.urls = [t1, t2, t3]
		this.meshes = []

		this.textures = this.urls.map(url => new THREE.TextureLoader().load(url))
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 10
		)
 
		this.camera.position.set(0, 0, 2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true


		this.initPost()

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.settings()
 
	}

	initPost() {
		this.composer = new EffectComposer(this.renderer)
		this.composer.addPass(new RenderPass(this.scene, this.camera))
		this.effect1 = new ShaderPass(CustomPass)
		 
		this.composer.addPass(this.effect1)

		// const effect2 = new ShaderPass(RGBShiftShader)
		// effect2.uniforms.amount.value = 0.0015
		// this.composer.addPass(effect2)

	}

	settings() {
		let that = this
		this.settings = {
			progress: 0,
			scale: 1
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
		this.gui.add(this.settings, 'scale', 0, 10, 0.01)

	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		// this.imageAspect = 853/1280
		// let a1, a2
		// if(this.height / this.width > this.imageAspect) {
		// 	a1 = (this.width / this.height) * this.imageAspect
		// 	a2 = 1
		// } else {
		// 	a1 = 1
		// 	a2 = (this.height / this.width) / this.imageAspect
		// } 


		// this.material.uniforms.resolution.value.x = this.width
		// this.material.uniforms.resolution.value.y = this.height
		// this.material.uniforms.resolution.value.z = a1
		// this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				uTexture: {value: this.textures[0]},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})
		
		this.geometry = new THREE.PlaneGeometry(1.9/2,1/2,1,1)

		this.textures.forEach((t, i) => {
			const m = this.material.clone()
			m.uniforms.uTexture.value = t
		
			const mesh = new THREE.Mesh(this.geometry, m)
			this.scene.add(mesh)
			this.meshes.push(mesh)
			mesh.position.x = i - 1
			// mesh.position.y = - 1

	 

		}
		)

 
 
 
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {

		this.meshes.forEach((m, i) => {
			// m.position.y = -this.settings.progress
			m.rotation.z = this.settings.progress * Math.PI / 2 
		})


		if(!this.isPlaying) return
		this.time += 0.01
		this.material.uniforms.time.value = this.time
		this.effect1.uniforms.time.value = this.time
		this.effect1.uniforms.progress.value = this.settings.progress
		this.effect1.uniforms.scale.value = this.settings.scale


		 
		//this.renderer.setRenderTarget(this.renderTarget)
		// this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)

		this.composer.render()
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 