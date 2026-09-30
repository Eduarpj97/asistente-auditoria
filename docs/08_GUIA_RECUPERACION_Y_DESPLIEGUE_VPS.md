# Guía Maestra de Despliegue y Recuperación ante Desastres: VPS de Inferencia (Oracle Cloud + Ollama + Llama 3.1)

Este documento describe el procedimiento paso a paso para aprovisionar, configurar, blindar e integrar una nueva **VPS en Oracle Cloud Infrastructure (OCI)** en caso de fallo crítico, pérdida de conectividad o migración de la máquina actual.

---

## 1. Arquitectura de Inferencia

* **Proveedor Cloud:** Oracle Cloud Infrastructure (OCI - Free Tier).
* **Arquitectura de Procesamiento:** ARM64 Ampere A1 (`VM.Standard.A1.Flex`).
* **Recursos Asignados:** 4 OCPUs, 24 GB RAM.
* **Sistema Operativo:** Ubuntu 22.04 LTS o 24.04 LTS.
* **Motor LLM:** Ollama (servicio systemd persistente en memoria).
* **Modelo Oficial de Auditoría:** `llama3.1:8b`.
* **Consumo API:** Endpoint `/api/chat` en puerto `11434`.

---

## 2. Fase 1: Creación de la Instancia en Oracle Cloud (OCI)

1. Ingresa a la consola: [https://cloud.oracle.com/](https://cloud.oracle.com/).
2. En el menú de navegación, dirígete a: **Compute** > **Instances** (Instancias).
3. Haz clic en el botón azul **Create instance** (Crear instancia).
4. Configura los siguientes parámetros esenciales:
   * **Name (Nombre):** `ollama-audiflow-vps` (o el nombre que prefieras).
   * **Placement (Ubicación):** Deja el dominio de disponibilidad predeterminado.
   * **Image and shape (Imagen y forma):**
     * Haz clic en **Edit** (Editar).
     * **Image:** Selecciona `Canonical Ubuntu` (versión 22.04 o 24.04).
     * **Shape:** Cambia a **Ampere (ARM Processor)** > `VM.Standard.A1.Flex`.
     * Asigna: **4 OCPUs** y **24 GB de Memoria RAM** (Cubierto 100% por el *Always Free Tier*).
   * **Networking (Red):**
     * Selecciona tu VCN existente (Virtual Cloud Network).
     * En **Assign a public IPv4 address**, asegúrate de que esté marcado **Yes (Assign a public IPv4 address)**.
   * **Add SSH keys (Claves SSH):**
     * Selecciona **Generate a key pair for me** y haz clic en **Save private key** (guarda el archivo `.key` en un lugar seguro de tu computadora) y **Save public key**.
     * *(Opcional)* Si ya tienes tu propia clave pública, selecciona *Upload public key files*.
5. Haz clic en **Create** (Crear) al final de la página.
6. Espera 1 a 2 minutos hasta que el estado cambie a **Running** (En ejecución).
7. Copia la **Public IP Address** (Dirección IP Pública) que te asigne Oracle.

---

## 3. Fase 2: Configuración del Firewall Externo (Security List en OCI)

Para que el tráfico desde internet pueda alcanzar tu VPS, debes abrir los puertos en la red virtual de Oracle:

1. En la consola de Oracle, ve a: **Networking** > **Virtual cloud networks** (VCN).
2. Haz clic sobre el nombre de tu VCN.
3. En el menú lateral izquierdo (*Resources*), haz clic en **Security Lists** (Listas de seguridad).
4. Selecciona la lista principal: **Default Security List for...**
5. En la sección **Ingress Rules** (Reglas de entrada), verifica que existan las dos siguientes reglas:
   * **Regla 1 (SSH):**
     * Source CIDR: `0.0.0.0/0`
     * IP Protocol: `TCP`
     * Destination Port Range: `22`
   * **Regla 2 (Ollama API):**
     * Si no existe, haz clic en **Add Ingress Rules**:
       * **Source CIDR:** `0.0.0.0/0`
       * **IP Protocol:** `TCP`
       * **Destination Port Range:** `11434`
       * **Description:** `Ollama Inbound API`
     * Haz clic en **Add Ingress Rules**.

---

## 4. Fase 3: Conexión SSH y Optimización de Red (MTU y MSS Clamping)

Conéctate por SSH a tu nueva VPS (vía PowerShell, Git Bash o PuTTY):

```powershell
ssh -i /ruta/a/tu_clave_privada.key ubuntu@<IP_PUBLICA_DE_LA_VPS>
```

> [!TIP]
> **¿No responde SSH o da Connection Timed Out?**  
> Entra a Oracle Cloud Console > **Compute** > **Instances** > Clic en tu máquina > Pestaña **Console connection** > **Launch Cloud Shell connection**. Tendrás una terminal directa desde el navegador web sin depender de puertos bloqueados en tu Wi-Fi.

Una vez dentro de la terminal Linux, ejecuta los siguientes comandos para configurar el **MTU** y el **MSS Clamping** (evita congelamientos de red en paquetes grandes sobre Wi-Fi):

```bash
# 1. Identificar la interfaz de red (usualmente enp0s6 o eth0)
ip link show

# 2. Ajustar MTU a 1400 (reemplaza enp0s6 si tu interfaz tiene otro nombre)
sudo ip link set dev enp0s6 mtu 1400

# 3. Aplicar MSS Clamping a 1200 para paquetes TCP SYN
sudo iptables -t mangle -A PREROUTING -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1200
sudo iptables -t mangle -A POSTROUTING -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1200
```

---

## 5. Fase 4: Instalación y Configuración del Servicio Ollama

Ejecuta este bloque completo para instalar Ollama y habilitarlo hacia internet manteniendo el modelo permanentemente en memoria:

```bash
# 1. Instalar Ollama oficial
curl -fsSL https://ollama.com/install.sh | sh

# 2. Crear override de configuración de systemd
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo bash -c 'cat <<EOF > /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_KEEP_ALIVE=-1"
EOF'

# 3. Recargar y reiniciar el servicio
sudo systemctl daemon-reload
sudo systemctl restart ollama

# 4. Abrir el puerto 11434 en la primera posición del firewall interno de Ubuntu
sudo iptables -I INPUT 1 -p tcp --dport 11434 -j ACCEPT

# 5. Instalar persistencia de iptables para que las reglas sobrevivan reinicios
sudo apt-get update && sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 6. Fase 5: Descarga y Calentamiento del Modelo

Descarga el modelo oficial de auditoría:

```bash
# Descargar Llama 3.1 8B (tardará aprox. 2-3 minutos con la red de Oracle Cloud)
ollama pull llama3.1:8b
```

### Verificaciones en la terminal de la VPS:
1. **Verificar que Ollama escucha hacia internet:**
   ```bash
   sudo ss -tulpn | grep 11434
   # Debe mostrar: *:11434 o 0.0.0.0:11434
   ```
2. **Verificar que el modelo está descargado:**
   ```bash
   ollama list
   # Debe mostrar llama3.1:8b (4.9 GB)
   ```

---

## 7. Fase 6: Conexión con el Proyecto Local (Audiflow)

En tu máquina local:

1. **Actualizar el archivo `.env`:**  
   Abre `C:\Users\Eduardo\proyectos\asistente-auditoria\.env` y actualiza la IP:
   ```env
   OLLAMA_BASE_URL=http://<IP_PUBLICA_DE_LA_NUEVA_VPS>:11434
   OLLAMA_MODEL=llama3.1:8b
   ```

2. **Actualizar el archivo `.env.example`:**  
   Actualiza la variable `OLLAMA_BASE_URL` para mantener el repositorio sincronizado.

3. **Verificar el estado del backend:**  
   Inicia o reinicia tu servidor FastAPI local:
   ```powershell
   cd C:\Users\Eduardo\proyectos\asistente-auditoria\api
   python main.py
   ```

4. **Comprobar la salud del sistema:**  
   Abre tu navegador o ejecuta en PowerShell:
   ```powershell
   curl.exe http://127.0.0.1:8000/v1/health
   ```
   Debes recibir:
   ```json
   {
     "api_status": "ONLINE",
     "service": "Audiflow API",
     "ollama_engine": {
       "status": "ONLINE",
       "endpoint": "http://<IP_PUBLICA_DE_LA_NUEVA_VPS>:11434",
       "modelo_configurado": "llama3.1:8b",
       "modelos_disponibles": ["llama3.1:8b"]
     }
   }
   ```

---

## 8. Matriz de Solución de Problemas (Troubleshooting)

| Síntoma | Causa Raíz | Solución Inmediata |
| :--- | :--- | :--- |
| **Connection timed out en SSH (Puerto 22)** | Red Wi-Fi bloqueando puerto 22 o firewall de OCI. | Usar **Console connection > Launch Cloud Shell** en la consola web de Oracle. |
| **Ollama status OFFLINE en `/v1/health`** | Regla en Oracle Cloud VCN ausente o iptables en Ubuntu. | 1. Agregar Ingress Rule `11434` en OCI.<br>2. Ejecutar `sudo iptables -I INPUT 1 -p tcp --dport 11434 -j ACCEPT`. |
| **"No fue posible conectar con el motor..." al auditar** | El JSON generado se cortó por límite de tokens o el modelo estaba frío. | El backend cuenta con parser resiliente en `llm_audit_service.py`. Comprobar que en la VPS esté activo `OLLAMA_KEEP_ALIVE=-1`. |
| **Lentitud extrema en la VPS (> 150 segundos)** | Contención de hilos de CPU en la instancia ARM. | El código está optimizado con `num_thread: 3`. No subir a 4 hilos para evitar saturación de caché. |
| **Reglas de iptables se borran tras reiniciar VPS** | No se guardaron con persistencia. | Ejecutar `sudo netfilter-persistent save` dentro de la VPS. |

---

*Documento técnico preparado para el proyecto Audiflow - Universidad / Tesis.*
