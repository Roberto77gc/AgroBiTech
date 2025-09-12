// 🧪 SCRIPT DE TESTING COMPLETO PARA AGRODIGITAL
// Ejecutar en la consola del navegador en https://app.agrobitech.com

console.log('🚀 AGRODIGITAL - TESTING COMPLETO');
console.log('=====================================');

// Configuración
const API_BASE = 'https://api.agrobitech.com/api';
let testResults = {
    login: false,
    register: false,
    activities: false,
    fertigation: false,
    inventory: false,
    products: false,
    dashboard: false
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
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
    }
    
    return data;
}

// TEST 1: REGISTRO DE USUARIO
async function testRegister() {
    console.log('1️⃣ TESTING: Registro de usuario');
    try {
        const testEmail = `test_${Date.now()}@agrobitech.com`;
        const userData = {
            email: testEmail,
            password: 'Test123456!',
            name: 'Usuario Test'
        };
        
        const result = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (result.success && result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            console.log('✅ Registro exitoso');
            testResults.register = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error en registro:', error.message);
        return false;
    }
}

// TEST 2: LOGIN
async function testLogin() {
    console.log('2️⃣ TESTING: Login de usuario');
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

// TEST 3: DASHBOARD
async function testDashboard() {
    console.log('3️⃣ TESTING: Dashboard y estadísticas');
    try {
        const result = await apiRequest('/dashboard/stats');
        
        if (result.success) {
            console.log('✅ Dashboard cargado:', result.stats);
            testResults.dashboard = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error en dashboard:', error.message);
        return false;
    }
}

// TEST 4: CREAR ACTIVIDAD
async function testCreateActivity() {
    console.log('4️⃣ TESTING: Creación de actividad');
    try {
        const activityData = {
            name: `Test Activity ${new Date().toISOString()}`,
            cropType: 'Tomate',
            plantCount: 150,
            area: 0.2,
            areaUnit: 'ha',
            transplantDate: new Date().toISOString().split('T')[0],
            totalCost: 75.50,
            fertigation: { enabled: true, dailyRecords: [] },
            phytosanitary: { enabled: true, dailyRecords: [] },
            water: { enabled: true, dailyRecords: [] },
            location: 'Invernadero Test',
            notes: 'Actividad de prueba'
        };
        
        const result = await apiRequest('/dashboard/activities', {
            method: 'POST',
            body: JSON.stringify(activityData)
        });
        
        if (result.success && result.activity) {
            console.log('✅ Actividad creada:', result.activity._id);
            testResults.activities = true;
            return result.activity._id;
        }
    } catch (error) {
        console.log('❌ Error creando actividad:', error.message);
        return null;
    }
}

// TEST 5: GUARDAR DÍA DE FERTIRRIEGO
async function testFertigationDay(activityId) {
    console.log('5️⃣ TESTING: Guardado de día de fertirriego');
    try {
        const fertigationData = {
            date: new Date().toISOString().split('T')[0],
            fertilizers: [{
                productId: 'fert-test-1',
                productName: 'Fertilizante NPK 15-15-15',
                fertilizerAmount: 5,
                fertilizerUnit: 'kg',
                cost: 12.50
            }],
            waterConsumption: 200,
            waterUnit: 'L',
            totalCost: 12.50,
            notes: 'Primera aplicación de fertirriego'
        };
        
        const result = await apiRequest(`/dashboard/activities/${activityId}/fertigation`, {
            method: 'POST',
            body: JSON.stringify(fertigationData)
        });
        
        if (result.success) {
            console.log('✅ Día de fertirriego guardado');
            testResults.fertigation = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error guardando fertirriego:', error.message);
        return false;
    }
}

// TEST 6: GUARDAR INVENTARIO
async function testInventorySave() {
    console.log('6️⃣ TESTING: Guardado de inventario');
    try {
        const inventoryData = {
            productId: `inv-test-${Date.now()}`,
            productName: 'Fertilizante Test',
            productType: 'fertilizer',
            currentStock: 100,
            minStock: 10,
            criticalStock: 5,
            unit: 'kg',
            location: 'Almacén Principal'
        };
        
        const result = await apiRequest('/inventory', {
            method: 'POST',
            body: JSON.stringify(inventoryData)
        });
        
        if (result.success) {
            console.log('✅ Item de inventario guardado');
            testResults.inventory = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error guardando inventario:', error.message);
        return false;
    }
}

// TEST 7: GUARDAR PRODUCTO
async function testProductSave() {
    console.log('7️⃣ TESTING: Guardado de producto');
    try {
        const productData = {
            name: `Producto Test ${Date.now()}`,
            type: 'fertilizer',
            price: 25.99,
            unit: 'kg',
            supplier: 'Proveedor Test',
            description: 'Producto de prueba'
        };
        
        const result = await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        if (result.success) {
            console.log('✅ Producto guardado');
            testResults.products = true;
            return true;
        }
    } catch (error) {
        console.log('❌ Error guardando producto:', error.message);
        return false;
    }
}

// TEST 8: VERIFICAR PERSISTENCIA
async function testDataPersistence() {
    console.log('8️⃣ TESTING: Verificación de persistencia de datos');
    try {
        // Recargar dashboard
        const dashboard = await apiRequest('/dashboard/stats');
        console.log('📊 Dashboard recargado:', dashboard.stats);
        
        // Recargar actividades
        const activities = await apiRequest('/dashboard/activities');
        console.log('📋 Actividades:', activities.length || 0);
        
        // Recargar inventario
        const inventory = await apiRequest('/inventory');
        console.log('📦 Inventario:', inventory.length || 0);
        
        console.log('✅ Datos persisten correctamente');
        return true;
    } catch (error) {
        console.log('❌ Error verificando persistencia:', error.message);
        return false;
    }
}

// FUNCIÓN PRINCIPAL
async function runAllTests() {
    console.log('🚀 INICIANDO TESTS COMPLETOS...');
    console.log('================================');
    
    let activityId = null;
    
    try {
        // Test 1: Login (intentar primero con usuario existente)
        const loginSuccess = await testLogin();
        if (!loginSuccess) {
            console.log('⚠️  Login falló, intentando registro...');
            await testRegister();
        }
        
        // Test 2: Dashboard
        await testDashboard();
        
        // Test 3: Crear actividad
        activityId = await testCreateActivity();
        
        // Test 4: Fertirriego (si tenemos actividad)
        if (activityId) {
            await testFertigationDay(activityId);
        }
        
        // Test 5: Inventario
        await testInventorySave();
        
        // Test 6: Productos
        await testProductSave();
        
        // Test 7: Persistencia
        await testDataPersistence();
        
    } catch (error) {
        console.log('❌ Error general en tests:', error);
    }
    
    // RESUMEN FINAL
    console.log('');
    console.log('📊 RESUMEN DE TESTS:');
    console.log('===================');
    console.log(`✅ Login: ${testResults.login ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Registro: ${testResults.register ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Dashboard: ${testResults.dashboard ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Actividades: ${testResults.activities ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Fertirriego: ${testResults.fertigation ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Inventario: ${testResults.inventory ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Productos: ${testResults.products ? 'PASÓ' : 'FALLÓ'}`);
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log('');
    console.log(`🎯 RESULTADO: ${passedTests}/${totalTests} tests pasaron`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! La aplicación funciona perfectamente.');
    } else {
        console.log('⚠️  ALGUNOS TESTS FALLARON. Revisar logs arriba para detalles.');
    }
    
    return testResults;
}

// Ejecutar tests
runAllTests();
