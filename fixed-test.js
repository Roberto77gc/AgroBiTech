// 🧪 TESTING CORREGIDO - AGRODIGITAL
// Ejecutar en consola de https://app.agrobitech.com

console.log('🚀 AGRODIGITAL - TESTING CORREGIDO');
console.log('==================================');

let testResults = {
    api: false,
    register: false,
    login: false,
    dashboard: false,
    activity: false,
    inventory: false
};

// Función helper para requests
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };
    
    const response = await fetch(`https://api.agrobitech.com/api${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
    }
    
    return data;
}

// TEST 1: VERIFICAR API
async function testAPI() {
    console.log('1️⃣ Verificando API...');
    try {
        const result = await apiRequest('/health');
        console.log('✅ API funcionando:', result.message);
        testResults.api = true;
        return true;
    } catch (error) {
        console.log('❌ Error en API:', error.message);
        return false;
    }
}

// TEST 2: REGISTRAR USUARIO
async function testRegister() {
    console.log('2️⃣ Registrando usuario de prueba...');
    try {
        const userData = {
            email: 'test@agrobitech.com',
            password: 'test123',
            name: 'Usuario Test'
        };
        
        const result = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (result.success) {
            console.log('✅ Usuario registrado');
            if (result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                console.log('💾 Token guardado');
            }
            testResults.register = true;
            return true;
        }
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('⚠️  Usuario ya existe, continuando...');
            testResults.register = true;
            return true;
        }
        console.log('❌ Error registrando:', error.message);
        return false;
    }
}

// TEST 3: LOGIN
async function testLogin() {
    console.log('3️⃣ Probando login...');
    try {
        const credentials = {
            email: 'test@agrobitech.com',
            password: 'test123'
        };
        
        const result = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (result.success && result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            console.log('✅ Login exitoso');
            testResults.login = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error en login:', error.message);
        return false;
    }
}

// TEST 4: DASHBOARD
async function testDashboard() {
    console.log('4️⃣ Probando dashboard...');
    try {
        const result = await apiRequest('/dashboard/stats');
        console.log('✅ Dashboard cargado:', result.stats);
        testResults.dashboard = true;
        return true;
    } catch (error) {
        console.log('❌ Error en dashboard:', error.message);
        return false;
    }
}

// TEST 5: CREAR ACTIVIDAD
async function testCreateActivity() {
    console.log('5️⃣ Creando actividad de prueba...');
    try {
        const activityData = {
            name: 'Test Activity - ' + new Date().toISOString(),
            cropType: 'Tomate',
            plantCount: 100,
            area: 0.1,
            areaUnit: 'ha',
            totalCost: 50.00,
            fertigation: { enabled: true, dailyRecords: [] },
            phytosanitary: { enabled: true, dailyRecords: [] },
            water: { enabled: true, dailyRecords: [] }
        };
        
        const result = await apiRequest('/dashboard/activities', {
            method: 'POST',
            body: JSON.stringify(activityData)
        });
        
        if (result.success) {
            console.log('✅ Actividad creada:', result.activity?._id);
            testResults.activity = true;
            return result.activity?._id;
        }
    } catch (error) {
        console.log('❌ Error creando actividad:', error.message);
        return null;
    }
}

// TEST 6: CREAR INVENTARIO
async function testCreateInventory() {
    console.log('6️⃣ Creando item de inventario...');
    try {
        const inventoryData = {
            productId: 'test-product-' + Date.now(),
            productName: 'Fertilizante Test',
            productType: 'fertilizer',
            currentStock: 100,
            minStock: 10,
            criticalStock: 5,
            unit: 'kg',
            location: 'Almacén Test'
        };
        
        const result = await apiRequest('/inventory', {
            method: 'POST',
            body: JSON.stringify(inventoryData)
        });
        
        if (result.success) {
            console.log('✅ Item de inventario creado');
            testResults.inventory = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error creando inventario:', error.message);
        return false;
    }
}

// FUNCIÓN PRINCIPAL
async function runTests() {
    console.log('🚀 INICIANDO TESTS...');
    
    try {
        // Test 1: API
        await testAPI();
        
        // Test 2: Registrar usuario
        await testRegister();
        
        // Test 3: Login
        await testLogin();
        
        // Test 4: Dashboard
        await testDashboard();
        
        // Test 5: Crear actividad
        await testCreateActivity();
        
        // Test 6: Crear inventario
        await testCreateInventory();
        
    } catch (error) {
        console.log('❌ Error general:', error);
    }
    
    // RESUMEN
    console.log('');
    console.log('📊 RESUMEN DE TESTS:');
    console.log('===================');
    console.log(`✅ API: ${testResults.api ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Registro: ${testResults.register ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Login: ${testResults.login ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Dashboard: ${testResults.dashboard ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Actividad: ${testResults.activity ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Inventario: ${testResults.inventory ? 'PASÓ' : 'FALLÓ'}`);
    
    const passed = Object.values(testResults).filter(Boolean).length;
    const total = Object.keys(testResults).length;
    
    console.log('');
    console.log(`🎯 RESULTADO: ${passed}/${total} tests pasaron`);
    
    if (passed === total) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON!');
    } else {
        console.log('⚠️  ALGUNOS TESTS FALLARON');
    }
}

// Ejecutar
runTests();
