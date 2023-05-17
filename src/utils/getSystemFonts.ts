import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getSystemFonts(): Promise<string[]> {
  switch (process.platform) {
    case 'darwin':
      return await getDarwinSystemFonts();
    case 'win32':
      return await getWindowsSystemFonts();
    case 'linux':
      return await getLinuxSystemFonts();
    default:
      throw new Error(
        `Error: getSystemsFonts does not support platform ${process.platform}.`,
      );
  }
}

async function getWindowsSystemFonts(): Promise<string[]> {
  const script =
    'Add-Type -AssemblyName System.Drawing;(New-Object System.Drawing.Text.InstalledFontCollection).Families.Name';

  const cmd = `powershell -command "${script}"`;

  const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

  return stdout
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x !== '');
}

async function getDarwinSystemFonts() {
  const cmd = `<< SCPT osascript | uniq | sort 
  use framework "AppKit" 
  set fontNames to (current application's NSFontManager's sharedFontManager's availableFonts) as list 
  set result to "" 
  repeat with fontName in fontNames 
    set result to result & fontName & "\\n" 
  end repeat 
  return result
SCPT`;

  const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

  return stdout
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x !== '' && !x.startsWith('.'));
}

async function getLinuxSystemFonts() {
  const cmd = 'fc-list : family | uniq | sort';

  const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

  const fonts: string[] = [];

  for (const line of stdout.split('\n')) {
    const names = line.split(',');

    if (names.length > 1) {
      const name = names.find(
        (element, index) =>
          index > 0 &&
          // eslint-disable-next-line no-control-regex
          /^[\x00-\x7F]*$/.test(element) &&
          fonts.indexOf(element) === -1,
      );

      if (name != null) {
        fonts.push(name);
      }
    } else if (fonts.indexOf(line) === -1) {
      fonts.push(line);
    }
  }

  fonts.sort();

  return fonts.map((x) => x.trim()).filter((x) => x !== '');
}
