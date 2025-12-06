// Основной объект приложения с 3D
const SmartRoom3DPlanner = {
    // Состояние приложения
    state: {
        mode: 'select',
        viewMode: '2d',
        tools: {
            grid: true,
            snap: true,
            ortho: false,
            measure: false,
            rotate3d: false
        },
        snapSettings: {
            grid: true,
            endpoints: false,
            midpoints: false,
            intersections: false,
            ortho: false,
            distance: 10,
            gridSize: 50
        },
        objects: {
            walls: [],
            doors: [],
            windows: [],
            stairs: [],
            columns: [],
            rooms: [],
            furniture: [],
            devices: [],
            threeD: []
        },
        selectedObjects: [],
        currentObject: null,
        isDrawing: false,
        drawingStart: null,
        drawingPoints: [],
        scale: 1.0,
        offset: { x: 0, y: 0 },
        history: [],
        historyIndex: -1,
        layers: {
            walls: true,
            doors: true,
            windows: true,
            dimensions: true,
            threeD: true
        },
        threeD: {
            scene: null,
            camera: null,
            renderer: null,
            controls: null,
            cameraPosition: { x: 10, y: 10, z: 10 },
            cameraTarget: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            projection: 'perspective',
            isMouseDown: false,
            lastMouseX: 0,
            lastMouseY: 0,
            rotateSpeed: 0.005,
            zoomSpeed: 0.002,
            panSpeed: 0.01,
            moveSpeed: 0.1,
            keys: {
                w: false,
                a: false,
                s: false,
                d: false,
                q: false,
                e: false
            },
            currentCamera: 'iso'
        },
        snapPoints: [],
        snapLines: []
    },

    // DOM элементы
    elements: {
        canvas: null,
        ctx: null,
        canvas3d: null,
        navCube: null,
        navCubeContainer: null,
        snapPointsOverlay: null,
        canvasContainer: null,
        canvasOverlay: null
    },

    // Инициализация
    init() {
        console.log('🏠 SmartRoom 3D Planner инициализация...');
        
        this.initElements();
        this.initCanvas();
        this.init3D();
        this.initEventListeners();
        this.initUI();
        this.updateDateTime();
        this.loadFromLocalStorage();
        
        console.log('✅ 3D Планировщик готов!');
        this.showMessage('Готов к работе. Переключитесь в 3D для трехмерного просмотра!');
        
        setInterval(() => this.updateDateTime(), 60000);
        
        // Запускаем анимационный цикл
        this.animate();
        
        // Запускаем обработку движения в 3D
        this.start3DMovement();
    },

    // Анимационный цикл
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.state.viewMode === '3d' && this.state.threeD.renderer && 
            this.state.threeD.scene && this.state.threeD.camera) {
            
            // Обрабатываем движение камеры
            this.handle3DMovement();
            
            // Рендерим сцену
            this.state.threeD.renderer.render(this.state.threeD.scene, this.state.threeD.camera);
        }
    },

    // Обработка движения в 3D режиме
    start3DMovement() {
        // Обработка нажатия клавиш
        document.addEventListener('keydown', (e) => {
            if (this.state.viewMode !== '3d') return;
            
            switch(e.key.toLowerCase()) {
                case 'w': this.state.threeD.keys.w = true; break;
                case 'a': this.state.threeD.keys.a = true; break;
                case 's': this.state.threeD.keys.s = true; break;
                case 'd': this.state.threeD.keys.d = true; break;
                case 'q': this.state.threeD.keys.q = true; break;
                case 'e': this.state.threeD.keys.e = true; break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.state.viewMode !== '3d') return;
            
            switch(e.key.toLowerCase()) {
                case 'w': this.state.threeD.keys.w = false; break;
                case 'a': this.state.threeD.keys.a = false; break;
                case 's': this.state.threeD.keys.s = false; break;
                case 'd': this.state.threeD.keys.d = false; break;
                case 'q': this.state.threeD.keys.q = false; break;
                case 'e': this.state.threeD.keys.e = false; break;
            }
        });
    },

    handle3DMovement() {
        if (!this.state.threeD.camera) return;
        
        const speed = this.state.threeD.moveSpeed;
        const camera = this.state.threeD.camera;
        
        // Вектор направления камеры
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        // Вектор вправо относительно камеры
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();
        
        // Движение вперед/назад
        if (this.state.threeD.keys.w) {
            camera.position.addScaledVector(direction, speed);
        }
        if (this.state.threeD.keys.s) {
            camera.position.addScaledVector(direction, -speed);
        }
        
        // Движение влево/вправо
        if (this.state.threeD.keys.a) {
            camera.position.addScaledVector(right, speed);
        }
        if (this.state.threeD.keys.d) {
            camera.position.addScaledVector(right, -speed);
        }
        
        // Движение вверх/вниз
        if (this.state.threeD.keys.q) {
            camera.position.y += speed;
        }
        if (this.state.threeD.keys.e) {
            camera.position.y -= speed;
        }
        
        // Обновляем цель камеры для правильного направления
        camera.lookAt(
            camera.position.x + direction.x,
            camera.position.y + direction.y,
            camera.position.z + direction.z
        );
    },

    // Инициализация элементов
    initElements() {
        this.elements.canvas = document.getElementById('main-canvas');
        this.elements.ctx = this.elements.canvas.getContext('2d');
        this.elements.canvas3d = document.getElementById('3d-canvas');
        this.elements.navCube = document.getElementById('nav-cube');
        this.elements.navCubeContainer = document.getElementById('nav-cube-container');
        this.elements.snapPointsOverlay = document.getElementById('snap-points-overlay');
        this.elements.canvasContainer = document.querySelector('.canvas-container');
        this.elements.canvasOverlay = document.querySelector('.canvas-overlay');
    },

    // Инициализация Canvas
    initCanvas() {
        const container = this.elements.canvas.parentElement;
        const resizeCanvas = () => {
            this.elements.canvas.width = container.clientWidth;
            this.elements.canvas.height = container.clientHeight;
            this.elements.canvas3d.width = container.clientWidth;
            this.elements.canvas3d.height = container.clientHeight;
            
            if (this.state.viewMode === '3d' && this.state.threeD.renderer) {
                this.state.threeD.renderer.setSize(container.clientWidth, container.clientHeight);
                this.state.threeD.camera.aspect = container.clientWidth / container.clientHeight;
                this.state.threeD.camera.updateProjectionMatrix();
            }
            
            this.render();
        };
        
        resizeCanvas();
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 100);
        });
    },

    // Инициализация 3D
    init3D() {
        try {
            // Создаем сцену
            this.state.threeD.scene = new THREE.Scene();
            this.state.threeD.scene.background = new THREE.Color(0x0f172a);
            
            // Создаем камеру
            const canvasWidth = this.elements.canvas3d.width;
            const canvasHeight = this.elements.canvas3d.height;
            
            this.state.threeD.camera = new THREE.PerspectiveCamera(
                60,
                canvasWidth / canvasHeight,
                0.1,
                5000
            );
            
            // Устанавливаем позицию камеры по умолчанию (изометрия)
            this.state.threeD.camera.position.set(10, 10, 10);
            this.state.threeD.camera.lookAt(0, 0, 0);
            
            // Создаем рендерер
            this.state.threeD.renderer = new THREE.WebGLRenderer({
                canvas: this.elements.canvas3d,
                antialias: true,
                alpha: true
            });
            
            this.state.threeD.renderer.setSize(canvasWidth, canvasHeight);
            this.state.threeD.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.state.threeD.renderer.shadowMap.enabled = true;
            this.state.threeD.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Добавляем освещение
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.state.threeD.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 20, 10);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            this.state.threeD.scene.add(directionalLight);
            
            // Создаем сетку с центром в 0,0
            const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888888);
            gridHelper.position.y = -0.01;
            this.state.threeD.scene.add(gridHelper);
            
            console.log('✅ 3D сцена инициализирована');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации 3D:', error);
            this.showMessage('3D режим недоступен. Проверьте поддержку WebGL.');
        }
    },

    // Инициализация обработчиков событий
    initEventListeners() {
        // Canvas события
        this.elements.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.elements.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.elements.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.elements.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        // 3D Canvas события
        this.elements.canvas3d.addEventListener('mousedown', (e) => this.on3DMouseDown(e));
        this.elements.canvas3d.addEventListener('mousemove', (e) => this.on3DMouseMove(e));
        this.elements.canvas3d.addEventListener('mouseup', (e) => this.on3DMouseUp(e));
        this.elements.canvas3d.addEventListener('wheel', (e) => this.on3DWheel(e), { passive: false });
        
        // Кнопки инструментов
        document.getElementById('btn-select').addEventListener('click', () => this.setMode('select'));
        document.getElementById('btn-wall').addEventListener('click', () => this.setMode('wall'));
        document.getElementById('btn-room').addEventListener('click', () => this.setMode('room'));
        document.getElementById('btn-measure').addEventListener('click', () => this.toggleMeasure());
        document.getElementById('btn-3d-rotate').addEventListener('click', () => this.toggle3DRotate());
        
        // Кнопки поворота объекта
        document.getElementById('btn-rotate-cw').addEventListener('click', () => this.rotateSelectedObject(90));
        document.getElementById('btn-rotate-ccw').addEventListener('click', () => this.rotateSelectedObject(-90));
        
        // Переключение вида
        document.getElementById('btn-2d-view').addEventListener('click', () => this.switchViewMode('2d'));
        document.getElementById('btn-3d-view').addEventListener('click', () => this.switchViewMode('3d'));
        
        // Кнопки управления камерой
        document.querySelectorAll('.camera-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cameraView = e.currentTarget.dataset.camera;
                this.set3DView(cameraView);
            });
        });
        
        // Навигационный кубик
        document.querySelectorAll('.cube-face').forEach(face => {
            face.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.set3DView(view);
            });
        });
        
        // Обработка привязки
        document.getElementById('snap-grid').addEventListener('change', (e) => {
            this.state.snapSettings.grid = e.target.checked;
            this.updateSnapSettings();
        });
        
        document.getElementById('snap-endpoints').addEventListener('change', (e) => {
            this.state.snapSettings.endpoints = e.target.checked;
            this.updateSnapSettings();
        });
        
        document.getElementById('snap-midpoints').addEventListener('change', (e) => {
            this.state.snapSettings.midpoints = e.target.checked;
            this.updateSnapSettings();
        });
        
        document.getElementById('snap-intersections').addEventListener('change', (e) => {
            this.state.snapSettings.intersections = e.target.checked;
            this.updateSnapSettings();
        });
        
        document.getElementById('snap-ortho').addEventListener('change', (e) => {
            this.state.snapSettings.ortho = e.target.checked;
            this.updateSnapSettings();
        });
        
        document.getElementById('snap-distance-slider').addEventListener('input', (e) => {
            this.state.snapSettings.distance = parseInt(e.target.value);
            document.getElementById('snap-distance-value').textContent = `${this.state.snapSettings.distance} px`;
            this.updateSnapSettings();
        });
        
        document.getElementById('grid-size-select').addEventListener('change', (e) => {
            this.state.snapSettings.gridSize = parseInt(e.target.value);
            this.updateSnapSettings();
        });
        
        // 3D элементы управления
        document.getElementById('btn-rotate-x').addEventListener('click', () => this.rotate3DView('x'));
        document.getElementById('btn-rotate-y').addEventListener('click', () => this.rotate3DView('y'));
        document.getElementById('btn-rotate-z').addEventListener('click', () => this.rotate3DView('z'));
        document.getElementById('btn-reset-view').addEventListener('click', () => this.reset3DView());
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Остальные обработчики...
        this.initOtherEventListeners();
    },

    initOtherEventListeners() {
        // Кнопки в верхней панели
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.redo());
        // Кнопки сохранения и экспорта удалены
        
        // Кнопки зума
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        
        // Объекты из левой панели
        document.querySelectorAll('.object-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                if (type.startsWith('3d-')) {
                    this.setMode(type);
                } else {
                    this.setMode(type);
                }
            });
        });
        
        // Вкладки
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Кнопки свойств
        document.getElementById('btn-apply')?.addEventListener('click', () => this.applyProperties());
        document.getElementById('btn-delete')?.addEventListener('click', () => this.deleteSelected());
        
        // Кнопка полного экрана
        document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
        // Обработка имени проекта
        document.querySelector('.project-name').addEventListener('change', (e) => {
            this.showMessage(`Проект переименован: ${e.target.value}`);
        });
    },

    onKeyUp(e) {
        if (this.state.viewMode !== '3d') return;
        
        switch(e.key.toLowerCase()) {
            case 'w': this.state.threeD.keys.w = false; break;
            case 'a': this.state.threeD.keys.a = false; break;
            case 's': this.state.threeD.keys.s = false; break;
            case 'd': this.state.threeD.keys.d = false; break;
            case 'q': this.state.threeD.keys.q = false; break;
            case 'e': this.state.threeD.keys.e = false; break;
        }
    },

    // Переключение режима вида
    switchViewMode(mode) {
        this.state.viewMode = mode;
        
        const canvas2D = document.getElementById('main-canvas');
        const canvas3D = document.getElementById('3d-canvas');
        const navCube = this.elements.navCubeContainer;
        const controls3D = document.getElementById('3d-controls');
        const viewModeText = document.getElementById('view-mode');
        const viewInfo = document.getElementById('view-info');
        const canvasContainer = this.elements.canvasContainer;
        
        if (mode === '3d') {
            // Переключаем видимость canvas
            canvas2D.classList.remove('canvas-active');
            canvas2D.classList.add('canvas-hidden');
            canvas3D.classList.remove('canvas-hidden');
            canvas3D.classList.add('canvas-active');
            
            // Показываем элементы управления 3D
            if (navCube) navCube.style.display = 'block';
            if (controls3D) controls3D.style.display = 'flex';
            
            // Активируем навигационный кубик
            if (this.elements.navCube) {
                this.elements.navCube.classList.add('show-3d');
            }
            
            // Обновляем тексты
            if (viewModeText) viewModeText.textContent = '3D Вид';
            if (viewInfo) viewInfo.textContent = '3D вид';
            
            // Обновляем атрибут контейнера
            canvasContainer.setAttribute('data-view', '3d');
            
            // Устанавливаем камеру по умолчанию
            this.set3DView(this.state.threeD.currentCamera || 'iso');
            
            // Отрисовываем 3D сцену
            this.render3D();
            this.showMessage('3D вид активирован. Используйте WASDQE для перемещения камеры.');
        } else {
            // Переключаем видимость canvas
            canvas3D.classList.remove('canvas-active');
            canvas3D.classList.add('canvas-hidden');
            canvas2D.classList.remove('canvas-hidden');
            canvas2D.classList.add('canvas-active');
            
            // Скрываем элементы управления 3D
            if (navCube) navCube.style.display = 'none';
            if (controls3D) controls3D.style.display = 'none';
            
            // Обновляем тексты
            if (viewModeText) viewModeText.textContent = '2D Вид';
            if (viewInfo) viewInfo.textContent = '2D вид';
            
            // Обновляем атрибут контейнера
            canvasContainer.setAttribute('data-view', '2d');
            
            // Отрисовываем 2D сцену
            this.render();
            this.showMessage('2D вид активирован.');
        }
        
        // Обновляем активные кнопки
        const btn2d = document.getElementById('btn-2d-view');
        const btn3d = document.getElementById('btn-3d-view');
        
        if (btn2d) btn2d.classList.toggle('active', mode === '2d');
        if (btn3d) btn3d.classList.toggle('active', mode === '3d');
    },

    // Установка 3D вида
    set3DView(view) {
        // Сохраняем текущий вид камеры
        this.state.threeD.currentCamera = view;
        
        // Обновляем активные кнопки камеры
        document.querySelectorAll('.camera-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.camera === view) {
                btn.classList.add('active');
            }
        });
        
        // Обновляем активную грань куба
        document.querySelectorAll('.cube-face').forEach(face => {
            face.classList.remove('active');
            if (face.dataset.view === view) {
                face.classList.add('active');
            }
        });
        
        // Устанавливаем камеру в зависимости от вида
        const distance = 15; // Расстояние от центра
        
        switch(view) {
            case 'front':
                this.state.threeD.camera.position.set(0, 0, distance);
                this.state.threeD.camera.lookAt(0, 0, 0);
                break;
            case 'back':
                this.state.threeD.camera.position.set(0, 0, -distance);
                this.state.threeD.camera.lookAt(0, 0, 0);
                break;
            case 'left':
                this.state.threeD.camera.position.set(-distance, 0, 0);
                this.state.threeD.camera.lookAt(0, 0, 0);
                break;
            case 'right':
                this.state.threeD.camera.position.set(distance, 0, 0);
                this.state.threeD.camera.lookAt(0, 0, 0);
                break;
            case 'top':
                this.state.threeD.camera.position.set(0, distance, 0);
                this.state.threeD.camera.lookAt(0, 0, 0);
                this.state.threeD.camera.up.set(0, 0, -1);
                break;
            case 'bottom':
                this.state.threeD.camera.position.set(0, -distance, 0);
                this.state.threeD.camera.lookAt(0, 0, 0);
                this.state.threeD.camera.up.set(0, 0, 1);
                break;
            case 'iso':
                this.state.threeD.camera.position.set(distance, distance, distance);
                this.state.threeD.camera.lookAt(0, 0, 0);
                this.state.threeD.camera.up.set(0, 1, 0);
                break;
        }
        
        this.showMessage(`Вид камеры установлен: ${view}`);
        this.render3D();
    },

    // Вращение 3D вида
    rotate3DView(axis) {
        if (this.state.viewMode !== '3d') return;
        
        const angle = 90;
        
        switch(axis) {
            case 'x':
                this.state.threeD.rotation.x += angle;
                break;
            case 'y':
                this.state.threeD.rotation.y += angle;
                break;
            case 'z':
                this.state.threeD.rotation.z += angle;
                break;
        }
        
        this.state.threeD.rotation.x = this.state.threeD.rotation.x % 360;
        this.state.threeD.rotation.y = this.state.threeD.rotation.y % 360;
        this.state.threeD.rotation.z = this.state.threeD.rotation.z % 360;
        
        this.update3DCameraRotation();
        this.showMessage(`Вращение по оси ${axis.toUpperCase()}`);
    },

    reset3DView() {
        this.set3DView('iso');
    },

    toggle3DRotate() {
        this.state.tools.rotate3d = !this.state.tools.rotate3d;
        document.getElementById('btn-3d-rotate').classList.toggle('active', this.state.tools.rotate3d);
        
        if (this.state.tools.rotate3d && this.state.viewMode !== '3d') {
            this.switchViewMode('3d');
        }
        
        this.showMessage(this.state.tools.rotate3d ? 'Режим вращения 3D включен' : 'Режим вращения 3D выключен');
    },

    update3DCameraRotation() {
        if (!this.state.threeD.camera) return;
        
        this.state.threeD.camera.rotation.set(
            THREE.MathUtils.degToRad(this.state.threeD.rotation.x),
            THREE.MathUtils.degToRad(this.state.threeD.rotation.y),
            THREE.MathUtils.degToRad(this.state.threeD.rotation.z)
        );
        
        this.render3D();
    },

    // Система привязки
    updateSnapSettings() {
        const snapDistanceValue = this.state.snapSettings.distance;
        const gridSize = this.state.snapSettings.gridSize;
        
        document.getElementById('snap-distance-value').textContent = `${snapDistanceValue} px`;
        document.getElementById('grid-size-select').value = gridSize;
        document.getElementById('snap-ortho').checked = this.state.snapSettings.ortho;
        
        // Обновляем подсказку в футере
        const snapHint = document.getElementById('snap-hint');
        snapHint.textContent = `Привязка: ${gridSize} см`;
        
        const isEnabled = this.state.snapSettings.grid;
        
        document.getElementById('snap-status').textContent = 
            `Привязка: ${isEnabled ? 'Включена' : 'Выключена'}`;
        
        if (this.state.viewMode === '2d') {
            this.calculateSnapPoints();
            this.renderSnapPoints();
        }
        
        this.showMessage('Настройки привязки обновлены');
    },

    calculateSnapPoints() {
        if (this.state.viewMode !== '2d') return;
        
        this.state.snapPoints = [];
        this.state.snapLines = [];
        
        if (!this.state.snapSettings.grid) {
            return;
        }
        
        // Добавляем сетку с центром в 0,0
        const gridSize = this.state.snapSettings.gridSize;
        const canvasWidth = this.elements.canvas.width;
        const canvasHeight = this.elements.canvas.height;
        
        // Центр холста в координатах мира
        const centerX = -this.state.offset.x / this.state.scale;
        const centerY = -this.state.offset.y / this.state.scale;
        
        // Границы видимой области
        const startX = centerX - canvasWidth / (2 * this.state.scale);
        const startY = centerY - canvasHeight / (2 * this.state.scale);
        const endX = centerX + canvasWidth / (2 * this.state.scale);
        const endY = centerY + canvasHeight / (2 * this.state.scale);
        
        // Вертикальные линии сетки
        for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
            this.state.snapLines.push({
                type: 'vertical',
                x: x,
                y1: startY,
                y2: endY
            });
        }
        
        // Горизонтальные линии сетки
        for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
            this.state.snapLines.push({
                type: 'horizontal',
                y: y,
                x1: startX,
                x2: endX
            });
        }
    },

    renderSnapPoints() {
        if (this.state.viewMode !== '2d') return;
        
        const overlay = this.elements.snapPointsOverlay;
        overlay.innerHTML = '';
        
        // Отрисовываем линии сетки
        this.state.snapLines.forEach(line => {
            const lineEl = document.createElement('div');
            lineEl.className = 'snap-line';
            
            // Преобразуем мировые координаты в экранные
            const screenX = (line.x + this.state.offset.x) * this.state.scale;
            const screenY = (line.y + this.state.offset.y) * this.state.scale;
            const screenX1 = (line.x1 + this.state.offset.x) * this.state.scale;
            const screenY1 = (line.y1 + this.state.offset.y) * this.state.scale;
            const screenX2 = (line.x2 + this.state.offset.x) * this.state.scale;
            const screenY2 = (line.y2 + this.state.offset.y) * this.state.scale;
            
            if (line.type === 'vertical') {
                lineEl.style.left = `${screenX}px`;
                lineEl.style.top = `${screenY1}px`;
                lineEl.style.width = '1px';
                lineEl.style.height = `${screenY2 - screenY1}px`;
                lineEl.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
            } else if (line.type === 'horizontal') {
                lineEl.style.top = `${screenY}px`;
                lineEl.style.left = `${screenX1}px`;
                lineEl.style.height = '1px';
                lineEl.style.width = `${screenX2 - screenX1}px`;
                lineEl.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
            }
            
            overlay.appendChild(lineEl);
        });
    },

    // Получение позиции на canvas с центром в 0,0
    getCanvasPosition(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const canvasCenterX = this.elements.canvas.width / 2;
        const canvasCenterY = this.elements.canvas.height / 2;
        
        return {
            x: (e.clientX - rect.left - canvasCenterX) / this.state.scale - this.state.offset.x,
            y: (e.clientY - rect.top - canvasCenterY) / this.state.scale - this.state.offset.y
        };
    },

    // 2D обработчики мыши
    onMouseDown(e) {
        if (this.state.viewMode !== '2d') return;
        
        const pos = this.getCanvasPosition(e);
        const snappedPos = this.snapToPoint(pos);
        
        switch(this.state.mode) {
            case 'select':
                this.selectObject(pos, e.shiftKey);
                break;
            case 'wall':
                this.startDrawingWall(snappedPos);
                break;
            case 'room':
                this.startDrawingRoom(snappedPos);
                break;
            case 'door':
            case 'window':
            case 'stairs':
            case 'column':
                this.placeObject(snappedPos, this.state.mode);
                break;
            case '3d-cube':
            case '3d-sphere':
            case '3d-cylinder':
                this.place3DObject(snappedPos);
                break;
        }
        
        this.render();
    },

    onMouseMove(e) {
        if (this.state.viewMode !== '2d') return;
        
        const pos = this.getCanvasPosition(e);
        const snappedPos = this.snapToPoint(pos);
        
        const cursorX = Math.round(snappedPos.x);
        const cursorY = Math.round(snappedPos.y);
        document.getElementById('cursor-position').textContent = `X: ${cursorX}, Y: ${cursorY}, Z: 0`;
        
        if (this.state.isDrawing) {
            this.updateDrawing(snappedPos);
        }
        
        if (this.state.tools.measure && this.state.drawingStart) {
            const dx = snappedPos.x - this.state.drawingStart.x;
            const dy = snappedPos.y - this.state.drawingStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            document.getElementById('measurement').textContent = `${Math.round(distance)} см`;
        }
        
        // Подсветка объектов при наведении в режиме выделения
        if (this.state.mode === 'select') {
            this.highlightObjectAt(pos);
        }
    },

    onMouseUp(e) {
        if (this.state.viewMode !== '2d') return;
        
        if (this.state.isDrawing) {
            const pos = this.getCanvasPosition(e);
            const snappedPos = this.snapToPoint(pos);
            this.finishDrawing(snappedPos);
        }
        
        this.state.isDrawing = false;
        this.render();
    },

    onWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.state.scale = Math.max(0.2, Math.min(5, this.state.scale * delta));
        
        this.updateScaleDisplay();
        this.render();
    },

    // Система привязки
    snapToPoint(pos) {
        if (this.state.viewMode !== '2d') return pos;
        
        if (!this.state.snapSettings.grid) {
            return pos;
        }
        
        // Если включена ортогональная привязка и мы рисуем
        if (this.state.snapSettings.ortho && this.state.drawingStart) {
            return this.snapToOrtho(pos);
        }
        
        // Привязка к сетке
        if (this.state.snapSettings.grid) {
            return this.snapToGrid(pos);
        }
        
        return pos;
    },

    snapToOrtho(pos) {
        const start = this.state.drawingStart;
        const dx = Math.abs(pos.x - start.x);
        const dy = Math.abs(pos.y - start.y);
        
        if (dx > dy * 2) {
            return { x: pos.x, y: start.y };
        } else if (dy > dx * 2) {
            return { x: start.x, y: pos.y };
        } else {
            const angle = Math.atan2(pos.y - start.y, pos.x - start.x);
            const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return {
                x: start.x + Math.cos(snappedAngle) * distance,
                y: start.y + Math.sin(snappedAngle) * distance
            };
        }
    },

    snapToGrid(pos) {
        const gridSize = this.state.snapSettings.gridSize;
        return {
            x: Math.round(pos.x / gridSize) * gridSize,
            y: Math.round(pos.y / gridSize) * gridSize
        };
    },

    // Методы для объектов (остаются без изменений, кроме вращения)
    // ... остальной код методов объектов ...

    // Повернуть выделенный объект на указанный угол
    rotateSelectedObject(angle) {
        if (this.state.selectedObjects.length === 0) return;
        
        const selected = this.state.selectedObjects[0];
        const objIndex = selected.index;
        
        if (this.state.objects[selected.type] && this.state.objects[selected.type][objIndex]) {
            const obj = this.state.objects[selected.type][objIndex];
            
            // Получаем текущий угол из формы
            const currentAngle = parseFloat(document.getElementById('prop-angle').value) || 0;
            const newAngle = (currentAngle + angle) % 360;
            
            // Обновляем угол в форме
            document.getElementById('prop-angle').value = newAngle;
            
            // Применяем вращение
            this.applyRotationToObject(obj, selected.type, newAngle);
            
            this.saveToHistory();
            this.render();
            
            if (this.state.viewMode === '3d') {
                this.render3D();
            }
            
            this.showMessage(`Объект повернут на ${angle}°`);
        }
    },

    // Применить вращение к объекту
    applyRotationToObject(obj, type, angle) {
        switch(type) {
            case 'walls':
                // Для стены вычисляем новые координаты конца
                const centerX = (obj.x1 + obj.x2) / 2;
                const centerY = (obj.y1 + obj.y2) / 2;
                const length = Math.sqrt(Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2)) / 2;
                
                const newAngleRad = THREE.MathUtils.degToRad(angle);
                
                obj.x1 = centerX - Math.cos(newAngleRad) * length;
                obj.y1 = centerY - Math.sin(newAngleRad) * length;
                obj.x2 = centerX + Math.cos(newAngleRad) * length;
                obj.y2 = centerY + Math.sin(newAngleRad) * length;
                break;
                
            case 'doors':
            case 'windows':
                obj.angle = angle;
                break;
                
            case 'threeD':
                if (!obj.rotation) obj.rotation = { x: 0, y: 0, z: 0 };
                obj.rotation.y = angle;
                break;
        }
    },

    // Применение свойств - ИСПРАВЛЕННЫЙ МЕТОД
    applyProperties() {
        if (this.state.selectedObjects.length === 0) {
            this.showMessage('Нет выбранных объектов');
            return;
        }
        
        const selected = this.state.selectedObjects[0];
        const objIndex = selected.index;
        
        if (this.state.objects[selected.type] && this.state.objects[selected.type][objIndex]) {
            const obj = this.state.objects[selected.type][objIndex];
            
            // Получаем новые значения из формы
            const newType = document.getElementById('prop-type').value;
            const newName = document.getElementById('prop-name').value;
            const newX = parseFloat(document.getElementById('prop-pos-x').value) || obj.x || 0;
            const newY = parseFloat(document.getElementById('prop-pos-y').value) || obj.y || 0;
            const newZ = parseFloat(document.getElementById('prop-pos-z').value) || obj.z || 0;
            const newAngle = parseFloat(document.getElementById('prop-angle').value) || 0;
            
            // Обновляем основные свойства
            obj.name = newName || obj.name;
            obj.x = newX;
            obj.y = newY;
            obj.z = newZ;
            
            // Применяем вращение
            this.applyRotationToObject(obj, selected.type, newAngle);
            
            // Обновляем тип объекта без изменения размеров
            if (newType !== obj.type && newType !== selected.type) {
                this.changeObjectTypePreservingDimensions(obj, selected.type, objIndex, newType);
                return;
            }
            
            // Обновляем размеры в зависимости от типа
            if (selected.type === 'walls') {
                const newLength = parseFloat(document.getElementById('prop-length').value) || 100;
                const newHeight = parseFloat(document.getElementById('prop-height').value) || 250;
                const newThickness = parseFloat(document.getElementById('prop-thickness').value) || 10;
                
                // Сохраняем центр стены
                const centerX = (obj.x1 + obj.x2) / 2;
                const centerY = (obj.y1 + obj.y2) / 2;
                const currentAngle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
                const halfLength = newLength / 2;
                
                obj.x1 = centerX - Math.cos(currentAngle) * halfLength;
                obj.y1 = centerY - Math.sin(currentAngle) * halfLength;
                obj.x2 = centerX + Math.cos(currentAngle) * halfLength;
                obj.y2 = centerY + Math.sin(currentAngle) * halfLength;
                obj.height = newHeight;
                obj.thickness = newThickness;
                
            } else if (selected.type === 'doors' || selected.type === 'windows') {
                // Сохраняем текущие размеры, если они есть
                const currentWidth = obj.width || (selected.type === 'doors' ? 80 : 120);
                const currentHeight = obj.height || (selected.type === 'doors' ? 200 : 100);
                const currentThickness = obj.thickness || 5;
                
                obj.width = parseFloat(document.getElementById('prop-length').value) || currentWidth;
                obj.height = parseFloat(document.getElementById('prop-height').value) || currentHeight;
                obj.thickness = parseFloat(document.getElementById('prop-thickness').value) || currentThickness;
                
            } else if (selected.type === 'rooms') {
                obj.width = parseFloat(document.getElementById('prop-length').value) || obj.width;
                obj.height = parseFloat(document.getElementById('prop-height').value) || obj.height;
                
            } else if (selected.type === 'threeD') {
                if (obj.type === '3d-cube') {
                    obj.size = parseFloat(document.getElementById('prop-length').value) || obj.size;
                } else if (obj.type === '3d-sphere') {
                    obj.radius = parseFloat(document.getElementById('prop-length').value) / 2 || obj.radius;
                } else if (obj.type === '3d-cylinder') {
                    obj.radius = parseFloat(document.getElementById('prop-length').value) / 2 || obj.radius;
                    obj.height = parseFloat(document.getElementById('prop-height').value) || obj.height;
                }
                
                // Вращение
                obj.rotation = obj.rotation || { x: 0, y: 0, z: 0 };
                obj.rotation.x = parseFloat(document.getElementById('prop-rotate-x').value) || obj.rotation.x;
                obj.rotation.y = parseFloat(document.getElementById('prop-rotate-y').value) || obj.rotation.y;
                obj.rotation.z = parseFloat(document.getElementById('prop-rotate-z').value) || obj.rotation.z;
            }
            
            this.saveToHistory();
            this.render();
            
            if (this.state.viewMode === '3d') {
                this.render3D();
            }
            
            this.showMessage('Свойства применены');
        }
    },

    // Изменение типа объекта с сохранением размеров
    changeObjectTypePreservingDimensions(obj, oldType, oldIndex, newType) {
        // Сохраняем текущие размеры
        let width, height, thickness;
        
        if (oldType === 'walls') {
            const length = Math.sqrt(Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2));
            width = length;
            height = obj.height || 250;
            thickness = obj.thickness || 10;
        } else if (oldType === 'doors' || oldType === 'windows') {
            width = obj.width || (oldType === 'doors' ? 80 : 120);
            height = obj.height || (oldType === 'doors' ? 200 : 100);
            thickness = obj.thickness || 5;
        } else if (oldType === 'rooms') {
            width = obj.width || 200;
            height = obj.height || 200;
        } else if (oldType === 'threeD') {
            if (obj.type === '3d-cube') {
                width = obj.size || 100;
                height = obj.size || 100;
            } else if (obj.type === '3d-sphere') {
                width = obj.radius * 2 || 100;
                height = obj.radius * 2 || 100;
            } else if (obj.type === '3d-cylinder') {
                width = obj.radius * 2 || 60;
                height = obj.height || 100;
            }
        }
        
        // Удаляем объект из старого массива
        this.state.objects[oldType].splice(oldIndex, 1);
        
        // Создаем новый объект с сохраненными свойствами
        let newObj;
        
        switch(newType) {
            case 'wall':
                newObj = {
                    id: obj.id,
                    type: 'wall',
                    x1: obj.x || 0 - width/2,
                    y1: obj.y || 0,
                    x2: obj.x || 0 + width/2,
                    y2: obj.y || 0,
                    thickness: thickness || 10,
                    height: height || 250,
                    color: '#6c757d',
                    name: obj.name || 'Стена'
                };
                this.state.objects.walls.push(newObj);
                break;
                
            case 'door':
                newObj = {
                    id: obj.id,
                    type: 'door',
                    x: obj.x || 0,
                    y: obj.y || 0,
                    width: width || 80,
                    height: height || 200,
                    thickness: thickness || 5,
                    color: '#8B4513',
                    name: obj.name || 'Дверь',
                    angle: obj.angle || 0
                };
                this.state.objects.doors.push(newObj);
                break;
                
            case 'window':
                newObj = {
                    id: obj.id,
                    type: 'window',
                    x: obj.x || 0,
                    y: obj.y || 0,
                    width: width || 120,
                    height: height || 100,
                    thickness: thickness || 5,
                    color: '#87CEEB',
                    name: obj.name || 'Окно',
                    angle: obj.angle || 0
                };
                this.state.objects.windows.push(newObj);
                break;
                
            case '3d-cube':
                newObj = {
                    id: obj.id,
                    type: '3d-cube',
                    x: obj.x || 0,
                    y: obj.y || 0,
                    z: obj.z || 0,
                    size: width || 100,
                    color: '#9b59b6',
                    name: obj.name || '3D Куб',
                    rotation: obj.rotation || { x: 0, y: 0, z: 0 }
                };
                this.state.objects.threeD.push(newObj);
                break;
                
            case '3d-sphere':
                newObj = {
                    id: obj.id,
                    type: '3d-sphere',
                    x: obj.x || 0,
                    y: obj.y || 0,
                    z: obj.z || 0,
                    radius: width/2 || 50,
                    color: '#3498db',
                    name: obj.name || '3D Сфера',
                    rotation: obj.rotation || { x: 0, y: 0, z: 0 }
                };
                this.state.objects.threeD.push(newObj);
                break;
                
            case '3d-cylinder':
                newObj = {
                    id: obj.id,
                    type: '3d-cylinder',
                    x: obj.x || 0,
                    y: obj.y || 0,
                    z: obj.z || 0,
                    radius: width/2 || 30,
                    height: height || 100,
                    color: '#2ecc71',
                    name: obj.name || '3D Цилиндр',
                    rotation: obj.rotation || { x: 0, y: 0, z: 0 }
                };
                this.state.objects.threeD.push(newObj);
                break;
                
            case 'room':
                newObj = {
                    id: obj.id,
                    type: 'room',
                    x: (obj.x || 0) - width/2,
                    y: (obj.y || 0) - height/2,
                    width: width || 200,
                    height: height || 200,
                    color: '#4361ee',
                    name: obj.name || 'Комната'
                };
                this.state.objects.rooms.push(newObj);
                break;
        }
        
        // Обновляем выделение
        if (newObj) {
            this.state.selectedObjects = [{
                id: newObj.id,
                type: this.getTypeCategory(newType),
                index: this.state.objects[this.getTypeCategory(newType)].length - 1,
                obj: newObj
            }];
            
            this.updatePropertiesPanel(newObj, this.getTypeCategory(newType));
        }
        
        this.saveToHistory();
        this.render();
        
        if (this.state.viewMode === '3d') {
            this.render3D();
        }
        
        this.showMessage(`Тип объекта изменен на: ${newType}`);
    },

    getTypeCategory(type) {
        const categories = {
            'wall': 'walls',
            'door': 'doors',
            'window': 'windows',
            'stairs': 'stairs',
            'column': 'columns',
            'room': 'rooms',
            '3d-cube': 'threeD',
            '3d-sphere': 'threeD',
            '3d-cylinder': 'threeD'
        };
        return categories[type] || type;
    },

    // Рендеринг 2D с центром в 0,0
    render() {
        if (this.state.viewMode !== '2d') return;
        
        const ctx = this.elements.ctx;
        const width = this.elements.canvas.width;
        const height = this.elements.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Перемещаем начало координат в центр холста
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(this.state.scale, this.state.scale);
        ctx.translate(this.state.offset.x, this.state.offset.y);
        
        if (this.state.tools.grid) {
            this.drawGrid(ctx);
        }
        
        this.drawObjects(ctx);
        
        if (this.state.isDrawing && this.state.currentObject) {
            this.drawCurrentObject(ctx);
        }
        
        this.drawSelection(ctx);
        
        ctx.restore();
    },

    drawGrid(ctx) {
        const gridSize = this.state.snapSettings.gridSize;
        
        // Границы видимой области
        const halfWidth = this.elements.canvas.width / (2 * this.state.scale);
        const halfHeight = this.elements.canvas.height / (2 * this.state.scale);
        
        const startX = -halfWidth - this.state.offset.x;
        const startY = -halfHeight - this.state.offset.y;
        const endX = halfWidth - this.state.offset.x;
        const endY = halfHeight - this.state.offset.y;
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        
        // Вертикальные линии
        for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
        
        // Оси координат
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)';
        ctx.lineWidth = 2;
        
        // Ось X
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, 0);
        ctx.stroke();
        
        // Ось Y
        ctx.beginPath();
        ctx.moveTo(0, startY);
        ctx.lineTo(0, endY);
        ctx.stroke();
    },

    // Остальные методы остаются без изменений, кроме адаптации к новым координатам
    // ... остальной код ...

    // Zoom
    zoomIn() {
        this.state.scale = Math.min(this.state.scale * 1.2, 5);
        this.updateScaleDisplay();
        this.render();
    },

    zoomOut() {
        this.state.scale = Math.max(this.state.scale / 1.2, 0.2);
        this.updateScaleDisplay();
        this.render();
    },

    updateScaleDisplay() {
        const scalePercent = Math.round(this.state.scale * 100);
        document.getElementById('scale-value').textContent = `${scalePercent}%`;
        
        const fillPercent = (this.state.scale - 0.2) / (5 - 0.2) * 100;
        document.getElementById('scale-fill').style.width = `${fillPercent}%`;
    },

    // История
    saveToHistory() {
        const stateCopy = JSON.parse(JSON.stringify({
            objects: this.state.objects,
            selectedObjects: this.state.selectedObjects,
            mode: this.state.mode,
            scale: this.state.scale,
            offset: this.state.offset
        }));
        
        // Удаляем старые состояния после текущего индекса
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        }
        
        this.state.history.push(stateCopy);
        this.state.historyIndex = this.state.history.length - 1;
        
        // Ограничиваем размер истории
        if (this.state.history.length > 50) {
            this.state.history.shift();
            this.state.historyIndex--;
        }
        
        this.updateUndoRedoButtons();
    },

    undo() {
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            const previousState = this.state.history[this.state.historyIndex];
            
            this.state.objects = previousState.objects;
            this.state.selectedObjects = previousState.selectedObjects;
            this.state.mode = previousState.mode;
            this.state.scale = previousState.scale;
            this.state.offset = previousState.offset;
            
            this.updateUndoRedoButtons();
            this.render();
            
            if (this.state.viewMode === '3d') {
                this.render3D();
            }
            
            this.showMessage('Действие отменено');
        } else {
            this.showMessage('Нет действий для отмены');
        }
    },

    redo() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            const nextState = this.state.history[this.state.historyIndex];
            
            this.state.objects = nextState.objects;
            this.state.selectedObjects = nextState.selectedObjects;
            this.state.mode = nextState.mode;
            this.state.scale = nextState.scale;
            this.state.offset = nextState.offset;
            
            this.updateUndoRedoButtons();
            this.render();
            
            if (this.state.viewMode === '3d') {
                this.render3D();
            }
            
            this.showMessage('Действие повторено');
        } else {
            this.showMessage('Нет действий для повторения');
        }
    },

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        
        undoBtn.disabled = this.state.historyIndex <= 0;
        redoBtn.disabled = this.state.historyIndex >= this.state.history.length - 1;
        
        undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
        redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
    },

    // Сохранение/загрузка (упрощенная версия)
    saveProject() {
        const projectData = {
            objects: this.state.objects,
            scale: this.state.scale,
            offset: this.state.offset,
            viewMode: this.state.viewMode,
            history: this.state.history,
            historyIndex: this.state.historyIndex
        };
        
        localStorage.setItem('smartroom_project', JSON.stringify(projectData));
        this.showMessage('Проект сохранен');
    },

    loadFromLocalStorage() {
        const saved = localStorage.getItem('smartroom_project');
        if (saved) {
            try {
                const projectData = JSON.parse(saved);
                
                if (projectData.objects) {
                    this.state.objects = projectData.objects;
                }
                
                if (projectData.scale) this.state.scale = projectData.scale;
                if (projectData.offset) this.state.offset = projectData.offset;
                if (projectData.viewMode) this.state.viewMode = projectData.viewMode;
                if (projectData.history) this.state.history = projectData.history;
                if (projectData.historyIndex !== undefined) this.state.historyIndex = projectData.historyIndex;
                
                this.updateScaleDisplay();
                this.updateUndoRedoButtons();
                this.render();
                
                if (this.state.viewMode === '3d') {
                    this.switchViewMode('3d');
                }
                
                this.showMessage('Проект загружен');
            } catch (error) {
                console.error('Ошибка загрузки проекта:', error);
            }
        }
    },

    // Вкладки
    switchTab(tabId) {
        document.querySelectorAll('.left-sidebar .sidebar-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        document.querySelectorAll('.left-sidebar .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    },

    deleteSelected() {
        if (this.state.selectedObjects.length === 0) {
            this.showMessage('Нет выбранных объектов для удаления');
            return;
        }
        
        // Сортируем по индексу в обратном порядке
        const sortedSelected = [...this.state.selectedObjects].sort((a, b) => b.index - a.index);
        
        sortedSelected.forEach(selected => {
            if (this.state.objects[selected.type]) {
                this.state.objects[selected.type].splice(selected.index, 1);
            }
        });
        
        this.showMessage(`Удалено объектов: ${this.state.selectedObjects.length}`);
        this.state.selectedObjects = [];
        this.hidePropertiesPanel();
        this.hideRotationControls();
        this.saveToHistory();
        this.render();
        
        if (this.state.viewMode === '3d') {
            this.render3D();
        }
    },

    // Полноэкранный режим
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Ошибка при включении полноэкранного режима: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },

    // Горячие клавиши
    onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case 'w':
                if (this.state.viewMode === '3d') {
                    this.state.threeD.keys.w = true;
                } else {
                    e.preventDefault();
                    this.setMode('wall');
                }
                break;
            case 'a':
                if (this.state.viewMode === '3d') {
                    this.state.threeD.keys.a = true;
                }
                break;
            case 's':
                if (this.state.viewMode === '3d') {
                    this.state.threeD.keys.s = true;
                } else {
                    e.preventDefault();
                    this.toggleSnap();
                }
                break;
            case 'd':
                if (this.state.viewMode === '3d') {
                    this.state.threeD.keys.d = true;
                }
                break;
            case 'q':
                if (this.state.viewMode === '3d') {
                    this.state.threeD.keys.q = true;
                }
                break;
            case 'e':
                if (this.state.viewMode === '3d') {
                    this.state.threeD.keys.e = true;
                }
                break;
            case 'r':
                e.preventDefault();
                this.setMode('room');
                break;
            case 'v':
                e.preventDefault();
                this.setMode('select');
                break;
            case 'm':
                e.preventDefault();
                this.toggleMeasure();
                break;
            case 'g':
                e.preventDefault();
                this.toggleGrid();
                break;
            case '2':
                e.preventDefault();
                this.switchViewMode('2d');
                break;
            case '3':
                e.preventDefault();
                this.switchViewMode('3d');
                break;
            case '+':
            case '=':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.zoomIn();
                }
                break;
            case '-':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.zoomOut();
                }
                break;
            case 'z':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.undo();
                }
                break;
            case 'y':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.redo();
                }
                break;
            case 'delete':
            case 'backspace':
                e.preventDefault();
                this.deleteSelected();
                break;
            case 'f11':
                e.preventDefault();
                this.toggleFullscreen();
                break;
        }
    },

    toggleGrid() {
        this.state.tools.grid = !this.state.tools.grid;
        this.showMessage(`Сетка ${this.state.tools.grid ? 'включена' : 'выключена'}`);
        this.render();
    },

    toggleSnap() {
        this.state.snapSettings.grid = !this.state.snapSettings.grid;
        document.getElementById('snap-grid').checked = this.state.snapSettings.grid;
        this.updateSnapSettings();
        this.showMessage(`Привязка ${this.state.snapSettings.grid ? 'включена' : 'выключена'}`);
    },

    // Обновление даты и времени
    updateDateTime() {
        const now = new Date();
        
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        document.getElementById('current-date').textContent = `${day}.${month}.${year}`;
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    },

    // Инициализация UI
    initUI() {
        this.updateModeDisplay();
        this.updateScaleDisplay();
        this.updateSnapSettings();
        this.updateDateTime();
        
        this.elements.canvasContainer.setAttribute('data-view', this.state.viewMode);
    },

    // Показ сообщений
    showMessage(message, showToast = true) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
            
            if (showToast) {
                statusElement.classList.add('fade-in');
                
                setTimeout(() => {
                    statusElement.classList.remove('fade-in');
                }, 300);
                
                setTimeout(() => {
                    if (statusElement.textContent === message) {
                        statusElement.textContent = 'Готов к работе';
                    }
                }, 3000);
            }
        }
        
        console.log(`📢 ${message}`);
    }
};

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    SmartRoom3DPlanner.init();
});

// Обработка ошибок
window.addEventListener('error', function(event) {
    console.error('Глобальная ошибка:', event.error);
    if (SmartRoom3DPlanner.showMessage) {
        SmartRoom3DPlanner.showMessage('Произошла ошибка. Проверьте консоль для деталей.');
    }
});

// Обработка выхода из полноэкранного режима
document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    const btn = document.getElementById('btn-fullscreen');
    if (btn) {
        btn.innerHTML = isFullscreen ? 
            '<i class="fas fa-compress"></i>' : 
            '<i class="fas fa-expand"></i>';
    }
});