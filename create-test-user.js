// 🔧 SCRIPT PARA CREAR USUARIO DE PRUEBA
// Ejecutar en consola de https://app.agrobitech.com

console.log('👤 CREANDO USUARIO DE PRUEBA...');

async function createTestUser() {
    try {
        const userData = {
            email: 'test@agrobitech.com',
            password: 'test123',
            name: 'Usuario Test'
        };
        
        console.log('📝 Registrando usuario:', userData.email);
        
        const response = await fetch('https://api.agrobitech.com/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Usuario creado exitosamente');
            console.log('🔑 Token:', result.token ? 'Generado' : 'No generado');
            console.log('👤 Usuario:', result.user);
            
            // Guardar token para pruebas
            if (result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                console.log('💾 Token guardado en localStorage');
            }
            
            return true;
        } else {
            console.log('❌ Error creando usuario:', result.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

createTestUser();
