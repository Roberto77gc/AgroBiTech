// 🚀 TESTING RÁPIDO - AGRODIGITAL
// Ejecutar en consola de https://app.agrobitech.com

console.log('⚡ TESTING RÁPIDO - AGRODIGITAL');

// Test básico de conectividad
async function quickTest() {
    try {
        // 1. Verificar API
        console.log('1️⃣ Verificando API...');
        const health = await fetch('https://api.agrobitech.com/api/health');
        const healthData = await health.json();
        console.log('✅ API funcionando:', healthData.message);
        
        // 2. Test de login
        console.log('2️⃣ Probando login...');
        const login = await fetch('https://api.agrobitech.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@agrobitech.com', password: 'test123' })
        });
        
        if (login.ok) {
            const loginData = await login.json();
            localStorage.setItem('token', loginData.token);
            console.log('✅ Login exitoso');
            
            // 3. Test de dashboard
            console.log('3️⃣ Probando dashboard...');
            const dashboard = await fetch('https://api.agrobitech.com/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            
            if (dashboard.ok) {
                const dashboardData = await dashboard.json();
                console.log('✅ Dashboard cargado:', dashboardData.stats);
                
                // 4. Test de creación de actividad
                console.log('4️⃣ Probando creación de actividad...');
                const activity = await fetch('https://api.agrobitech.com/api/dashboard/activities', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${loginData.token}`
                    },
                    body: JSON.stringify({
                        name: 'Test Quick - ' + new Date().toISOString(),
                        cropType: 'Tomate',
                        area: 0.1,
                        areaUnit: 'ha',
                        totalCost: 25.00
                    })
                });
                
                if (activity.ok) {
                    const activityData = await activity.json();
                    console.log('✅ Actividad creada:', activityData.activity?._id);
                    console.log('🎉 ¡TODOS LOS TESTS BÁSICOS PASARON!');
                } else {
                    console.log('❌ Error creando actividad:', await activity.text());
                }
            } else {
                console.log('❌ Error en dashboard:', await dashboard.text());
            }
        } else {
            console.log('❌ Error en login:', await login.text());
        }
    } catch (error) {
        console.log('❌ Error general:', error);
    }
}

quickTest();
