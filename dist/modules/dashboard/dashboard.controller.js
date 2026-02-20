"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
const service = new dashboard_service_1.DashboardService();
class DashboardController {
    async get(req, res) {
        const data = await service.getData(req.user.estabelecimentoId);
        res.json(data);
    }
}
exports.DashboardController = DashboardController;
