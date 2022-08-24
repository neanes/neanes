import { exec, execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getSystemFonts(
  darwinBinaryFilePath: string,
): Promise<string[]> {
  switch (process.platform) {
    case 'darwin':
      return await getDarwinSystemFonts(darwinBinaryFilePath);
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

async function getDarwinSystemFonts(
  darwinBinaryFilePath: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    execFile(
      darwinBinaryFilePath,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        let fonts: string[] = [];

        if (stdout) {
          fonts = fonts.concat(stdout.split('\n').map((i) => i.trim()));
        }
        if (stderr) {
          fonts = fonts.concat(stderr.split('\n').map((i) => i.trim()));
        }

        fonts = Array.from(new Set(fonts)).filter((x) => !x.startsWith('.'));

        resolve(fonts);
      },
    );
  });
}

async function getLinuxSystemFonts() {
  const cmd = 'fc-list : family | uniq | sort';

  const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

  const fonts: string[] = [];

  for (let line of stdout.split('\n')) {
    const names = line.split(',');

    if (names.length > 1) {
      const name = names.find(
        (element, index) =>
          index > 0 &&
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
