<script>
// 2017-09-22: Disables sendBeacon() because the entries don't show up in
// ResourceTiming (which is used to validate some tests)
if (navigator && navigator.sendBeacon) {
    navigator.sendBeacon = undefined;
}
</script>
