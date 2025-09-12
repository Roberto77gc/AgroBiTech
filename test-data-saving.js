// Script para probar el guardado de datos en producción
// Ejecutar en la consola del navegador en https://app.agrobitech.com

console.log('🧪 INICIANDO TEST DE GUARDADO DE DATOS');

// Función para probar login
async function testLogin() {
    console.log('1️⃣ Probando login...');
    try {
        const response = await fetch('https://api.agrobitech.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@agrobitech.com',
                password: 'test123'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ Login exitoso');
            return true;
        } else {
            console.log('❌ Error en login:', await response.text());
            return false;
        }
    } catch (error) {
        console.log('❌ Error en login:', error);
        return false;
    }
}

// Función para probar creación de actividad
async function testCreateActivity() {
    console.log('2️⃣ Probando creación de actividad...');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://api.agrobitech.com/api/dashboard/activities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Test Activity - ' + new Date().toISOString(),
                cropType: 'Tomate',
                plantCount: 100,
                area: 0.1,
                areaUnit: 'ha',
                totalCost: 50.00,
                fertigation: { enabled: true, dailyRecords: [] },
                phytosanitary: { enabled: true, dailyRecords: [] },
                water: { enabled: true, dailyRecords: [] }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Actividad creada:', data);
            return data.activity?._id;
        } else {
            console.log('❌ Error creando actividad:', await response.text());
            return null;
        }
    } catch (error) {
        console.log('❌ Error creando actividad:', error);
        return null;
    }
}

// Función para probar guardado de fertirriego
async function testFertigationDay(activityId) {
    console.log('3️⃣ Probando guardado de día de fertirriego...');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://api.agrobitech.com/api/dashboard/activities/${activityId}/fertigation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                fertilizers: [{
                    productId: 'test-product-1',
                    productName: 'Fertilizante Test',
                    fertilizerAmount: 10,
                    fertilizerUnit: 'kg',
                    cost: 25.00
                }],
                waterConsumption: 100,
                waterUnit: 'L',
                totalCost: 25.00,
                notes: 'Test fertigation day'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Día de fertirriego guardado:', data);
            return true;
        } else {
            console.log('❌ Error guardando fertirriego:', await response.text());
            return false;
        }
    } catch (error) {
        console.log('❌ Error guardando fertirriego:', error);
        return false;
    }
}

// Función para probar guardado de inventario
async function testInventorySave() {
    console.log('4️⃣ Probando guardado de inventario...');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://api.agrobitech.com/api/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: 'test-product-' + Date.now(),
                productName: 'Producto Test',
                productType: 'fertilizer',
                currentStock: 100,
                minStock: 10,
                criticalStock: 5,
                unit: 'kg',
                location: 'Almacén Test'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Item de inventario guardado:', data);
            return true;
        } else {
            console.log('❌ Error guardando inventario:', await response.text());
            return false;
        }
    } catch (error) {
        console.log('❌ Error guardando inventario:', error);
        return false;
    }
}

// Función principal de testing
async function runAllTests() {
    console.log('🚀 INICIANDO TESTS COMPLETOS...');
    
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
        console.log('❌ FALLO: No se pudo hacer login');
        return;
    }
    
    // Test 2: Crear actividad
    const activityId = await testCreateActivity();
    if (!activityId) {
        console.log('❌ FALLO: No se pudo crear actividad');
        return;
    }
    
    // Test 3: Guardar fertirriego
    const fertigationSuccess = await testFertigationDay(activityId);
    
    // Test 4: Guardar inventario
    const inventorySuccess = await testInventorySave();
    
    // Resumen
    console.log('📊 RESUMEN DE TESTS:');
    console.log('✅ Login:', loginSuccess ? 'OK' : 'FALLO');
    console.log('✅ Crear Actividad:', activityId ? 'OK' : 'FALLO');
    console.log('✅ Guardar Fertirriego:', fertigationSuccess ? 'OK' : 'FALLO');
    console.log('✅ Guardar Inventario:', inventorySuccess ? 'OK' : 'FALLO');
    
    if (loginSuccess && activityId && fertigationSuccess && inventorySuccess) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! Los datos se guardan correctamente.');
    } else {
        console.log('⚠️  ALGUNOS TESTS FALLARON. Revisar logs arriba.');
    }
}

// Ejecutar tests
runAllTests();
