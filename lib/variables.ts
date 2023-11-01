const PAGE_PRINT_WIDTH = 5000;
const PAGE_PRINT_HEIGHT = 5000;

const CHART_LEFT_MARGIN = 60;
const CHART_RIGHT_MARGIN = 30;

const VARIABLES = {
    BROWSER_PAGE_WIDTH: PAGE_PRINT_WIDTH + CHART_LEFT_MARGIN + CHART_RIGHT_MARGIN,
    BROWSER_PAGE_HEIGHT: PAGE_PRINT_HEIGHT + 470,

    CHART_HEADER_HEIGHT: 36,
    CHART_BOTTOM_BORDER: 3,
    CHART_WIDTH_MARGIN: 2,
    CHART_RIGHT_BORDER: 3,

    PROJECT_MENU_CLASS: '.MuiGrid-root.MuiGrid-container',

    CHART_WRAPPER_CLASS: '#gantt',
    CHART_GRID_TITLE_CLASS: '.gantt_layout_cell.grid_cell',
    CHART_TIMELINE_CLASS: '.gantt_task_scale',
    CHART_TIMELINE_VISIBLE_CLASS: '.gantt_layout_cell.timeline_cell',
    CHART_VERTICAL_SCROLL_CLASS: '.gantt_layout_cell.gantt_ver_scroll.gantt_layout_cell_border_top',
    CHART_VERTICAL_SCROLL_HEIGHT_CLASS: '.gantt_layout_cell.gantt_ver_scroll.gantt_layout_cell_border_top div',
    CHART_HORIZONTAL_SCROLL_CLASS: '.gantt_layout_cell.gantt_hor_scroll',
    CHART_VERTICAL_WITHOUT_SCROLL_CLASS: '.gantt_task_bg',

    CHART_TASK_TITLE_CLASS: '.gantt_grid',

    PAGE_PRINT_WIDTH,
    PAGE_PRINT_HEIGHT,

    PRINT_PATH: './output/printed.jpg',
    PRINT_PARTIAL_PATH: './output/printed-',
    PDF_PATH: './output/chart.pdf',
}

export default VARIABLES;
