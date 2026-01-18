// src/uploader.js

// 1. IMPORT HATA DO (Kyunki humne index.html me script laga di hai)
// import Avrgirl from ... <-- DELETE THIS

export async function uploadHexFileToArduino(hexData, board, onStatusUpdate) {
  const boardMap = {
    'arduino:avr:uno': { name: 'uno', baudRate: 115200 },
    'arduino:avr:nano': { name: 'nano', baudRate: 57600 },
    'arduino:avr:mega': { name: 'mega', baudRate: 115200 }
  };

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let port = null;

  async function resetArduino(p) {
    onStatusUpdate('Resetting Arduino (Triggering Bootloader)...');
    try {
      await p.open({ baudRate: 1200 });
      await delay(100);
      await p.close();
      await delay(1000);
    } catch (e) {
      console.warn('Reset warning:', e);
    }
  }

  try {
    // 2. LIBRARY CHECK (Window object se uthayenge)
    // Note: Library global variable 'AvrgirlArduino' banati hai (Not just 'Avrgirl')
    const Avrgirl = window.AvrgirlArduino; 

    if (!Avrgirl) {
      throw new Error('Avrgirl library load nahi hui! Public folder check karo.');
    }

    if (!navigator.serial) {
      throw new Error('Web Serial API not supported. Use Chrome or Edge.');
    }

    // --- Port Selection ---
    onStatusUpdate('Checking ports...');
    const availablePorts = await navigator.serial.getPorts();
    if (availablePorts.length > 0) {
      port = availablePorts[0];
      onStatusUpdate('Using connected port.');
    } else {
      onStatusUpdate('Please select Arduino Port in the popup...');
      port = await navigator.serial.requestPort();
    }

    // --- Reset Board ---
    await resetArduino(port);

    const avrgirlBoard = boardMap[board];
    onStatusUpdate(`Initializing upload for ${avrgirlBoard.name}...`);

    // --- Setup Avrgirl ---
    const avrgirl = new Avrgirl({
      board: avrgirlBoard.name,
      port: port,
      debug: true,
      manualReset: false
    });

    // --- Flash ---
    await new Promise((resolve, reject) => {
      onStatusUpdate('Flashing firmware...');
      
      // Hex String ko Buffer mein convert karna zaroori hai
      const fileBuffer = Buffer.from(hexData);

      // 3. FIX: Yahan 'hexData' nahi, 'fileBuffer' pass karna hai
      avrgirl.flash(fileBuffer, (error) => {
        if (error) {
          reject(new Error(`Flash failed: ${error.message}`));
        } else {
          resolve();
        }
      });
    });

    onStatusUpdate('Upload completed!');

  } catch (error) {
    onStatusUpdate(`Upload Error: ${error.message}`);
    console.error(error);
    throw error;
  }
}