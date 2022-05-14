<template>
  <div>
    <div>
      Download the latest release from
      <a href="https://github.com/danielgarthur/neanes/releases" target="_blank"
        >Github</a
      >.
    </div>
    <template v-if="!error && rows.length > 0">
      <h2>{{ latestRelease.name }}</h2>
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

<script>
export default {
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
        'https://api.github.com/repos/danielgarthur/neanes/releases?per_page=1',
        { headers: { Accept: 'application/vnd.github.v3+json' } },
      );

      const releases = await response.json();

      this.latestRelease = releases[0];

      const linuxAsset = this.latestRelease.assets.find((x) =>
        x.name.endsWith('.AppImage'),
      );
      const macAsset = this.latestRelease.assets.find((x) =>
        x.name.endsWith('.dmg'),
      );
      const windowsAsset = this.latestRelease.assets.find((x) =>
        x.name.endsWith('.exe'),
      );

      this.rows.push({ asset: linuxAsset, os: 'Linux' });
      this.rows.push({ asset: macAsset, os: 'macOS' });
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
