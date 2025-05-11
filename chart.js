<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://s3.tradingview.com/tv.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        .price-up {
  animation: flashGreen 1s;
}
.price-down {
  animation: flashRed 1s;
}

@keyframes flashGreen {
  0% { background-color: rgba(78, 159, 61, 0.3); }
  100% { background-color: transparent; }
}
@keyframes flashRed {
  0% { background-color: rgba(216, 33, 72, 0.3); }
  100% { background-color: transparent; }
}