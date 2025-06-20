<template>
  <div>
    <div>
      Download the latest release from
      <a
        href="https://github.com/neanes/neanes/releases/latest"
        target="_blank"
        rel="noopener noreferrer"
        >Github</a
      >.
    </div>
    <template v-if="!error && rows.length > 0">
      <h2>{{ latestRelease.name }}</h2>
      <div>
        <a
          :href="latestRelease.html_url"
          target="_blank"
          rel="noopener noreferrer"
          >Release Notes</a
        >
      </div>
      <table>
        <thead>
          <tr>
            <th>File name</th>
            <th>OS</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.asset.id">
            <td>
              <a :href="row.asset.browser_download_url">{{ row.asset.name }}</a>
            </td>
            <td>{{ row.os }}</td>
            <td>{{ getFileSize(row.asset) }}</td>
          </tr>
        </tbody>

        <tbody></tbody>
      </table>
    </template>
  </div>
</template>

<script lang="ts">
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Downloads',
  data() {
    return {
      latestRelease: null,
      rows: [],
      error: false,
    };
  },

  async mounted() {
    try {
      const response = await fetch(
        'https://api.github.com/repos/neanes/neanes/releases?per_page=1',
        { headers: { Accept: 'application/vnd.github.v3+json' } },
      );

      const releases = await response.json();

      this.latestRelease = releases[0];

      const linuxAsset = this.latestRelease.assets.find((x) =>
        x.name.endsWith('.AppImage'),
      );
      const macAsset = this.latestRelease.assets.find(
        (x) => x.name.endsWith('.dmg') && !x.name.endsWith('arm64.dmg'),
      );
      const macArm64Asset = this.latestRelease.assets.find((x) =>
        x.name.endsWith('arm64.dmg'),
      );
      const windowsAsset = this.latestRelease.assets.find((x) =>
        x.name.endsWith('.exe'),
      );

      this.rows.push({ asset: linuxAsset, os: 'Linux' });
      this.rows.push({ asset: macArm64Asset, os: 'macOS on Apple Silicon' });
      this.rows.push({ asset: macAsset, os: 'macOS on Intel' });
      this.rows.push({ asset: windowsAsset, os: 'Windows' });
    } catch (e) {
      console.error(e);
      this.error = true;
    }
  },
  methods: {
    getFileSize(asset) {
      return (asset.size / 1024 / 1024).toFixed(2) + ' MiB';
    },
  },
};
</script>
