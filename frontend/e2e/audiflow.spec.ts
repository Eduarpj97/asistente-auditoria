import { test, expect } from '@playwright/test';

test.describe('Audiflow Suite End-to-End', () => {
  test('Flujo 1: Acceso a la plataforma y verificación de interfaz visual', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('/');

    // 2. Verificar título de la aplicación
    await expect(page).toHaveTitle(/Audiflow/i);

    // 3. Comprobar que no hay pantallas en blanco y la aplicación React monta correctamente
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // 4. Verificar elementos de marca y cabecera
    await expect(page.locator('text=Audiflow').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bienvenido de nuevo/i })).toBeVisible();
  });

  test('Flujo 2: Módulo de Autenticación, formularios y controles de seguridad', async ({ page }) => {
    await page.goto('/');

    // 1. Verificar inputs de inicio de sesión
    const emailInput = page.getByPlaceholder('ejemplo@empresa.com');
    const passwordInput = page.getByPlaceholder('••••••••••••');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // 2. Interactuar con el toggle de pestañas (Iniciar Sesión vs Registrarse)
    const registerTab = page.getByRole('button', { name: 'Registrarse' });
    await expect(registerTab).toBeVisible();
    await registerTab.click();

    // 3. Verificar que al cambiar a registro aparezca el botón submit de Crear Cuenta
    await expect(page.getByRole('button', { name: 'Crear Cuenta' })).toBeVisible();

    // 4. Regresar a Iniciar Sesión
    const loginTab = page.getByRole('button', { name: 'Iniciar Sesión' }).first();
    await loginTab.click();
    await expect(emailInput).toBeVisible();
  });

  test('Flujo 3: Verificación de Dashboard corporativo y analítica en vivo', async ({ page }) => {
    await page.goto('/');

    // Verificar panel de analítica corporativa presente en la landing
    await expect(page.getByText('Audiflow Live Analytics')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resumen Ejecutivo' })).toBeVisible();
    await expect(page.getByText(/Auditorías activas/i)).toBeVisible();
    await expect(page.getByText(/Riesgos críticos/i)).toBeVisible();
  });
});
