import { 
  initialProducts, 
  initialPrinterConfig, 
  createInitialSeedState 
} from './data/seedData.ts';
import { InMemoryTableRepository } from './repositories/memory/InMemoryTableRepository.ts';
import { InMemoryProductRepository } from './repositories/memory/InMemoryProductRepository.ts';
import { InMemoryOrderRepository } from './repositories/memory/InMemoryOrderRepository.ts';
import { InMemoryStockMovementRepository } from './repositories/memory/InMemoryStockMovementRepository.ts';
import { InMemoryPrinterConfigRepository } from './repositories/memory/InMemoryPrinterConfigRepository.ts';
import { FileUserRepository } from './repositories/memory/FileUserRepository.ts';

import { EventNotificationService } from './services/EventNotificationService.ts';
import { InventoryService } from './services/InventoryService.ts';
import { BillingService } from './services/BillingService.ts';
import { OrderService } from './services/OrderService.ts';
import { ReportService } from './services/ReportService.ts';
import { AuthService } from './services/AuthService.ts';

import { RateLimiter } from './security/RateLimiter.ts';
import { AuditLogger } from './security/AuditLogger.ts';
import { PaymentSecurityService } from './security/PaymentSecurityService.ts';
import { createAuthMiddleware } from './middlewares/authMiddleware.ts';

import { AuthController } from './controllers/AuthController.ts';
import { TableController } from './controllers/TableController.ts';
import { ProductController } from './controllers/ProductController.ts';
import { ReportController } from './controllers/ReportController.ts';
import { PrinterController } from './controllers/PrinterController.ts';
import { SecurityController } from './controllers/SecurityController.ts';

/**
 * Dependency Inversion Principle (DIP):
 * Composition Root that assembles all domain repositories, security engines, services, and controllers.
 */
export class ServiceContainer {
  // Repositories
  public readonly tableRepo: InMemoryTableRepository;
  public readonly productRepo: InMemoryProductRepository;
  public readonly orderRepo: InMemoryOrderRepository;
  public readonly stockMovementRepo: InMemoryStockMovementRepository;
  public readonly printerRepo: InMemoryPrinterConfigRepository;
  public readonly userRepo: FileUserRepository;

  // Security Engines
  public readonly rateLimiter: RateLimiter;
  public readonly auditLogger: AuditLogger;
  public readonly paymentSecurity: PaymentSecurityService;

  // Services
  public readonly notificationService: EventNotificationService;
  public readonly inventoryService: InventoryService;
  public readonly billingService: BillingService;
  public readonly orderService: OrderService;
  public readonly reportService: ReportService;
  public readonly authService: AuthService;

  // Controllers
  public readonly authController: AuthController;
  public readonly tableController: TableController;
  public readonly productController: ProductController;
  public readonly reportController: ReportController;
  public readonly printerController: PrinterController;
  public readonly securityController: SecurityController;

  // Middlewares
  public readonly authMiddleware: ReturnType<typeof createAuthMiddleware>;

  constructor() {
    // 1. Initialize Seed Data
    const seed = createInitialSeedState();

    // 2. Instantiate Repositories (Data Layer)
    this.tableRepo = new InMemoryTableRepository(seed.tables);
    this.productRepo = new InMemoryProductRepository(initialProducts);
    this.orderRepo = new InMemoryOrderRepository(seed.activeOrders, seed.historyOrders);
    this.stockMovementRepo = new InMemoryStockMovementRepository();
    this.printerRepo = new InMemoryPrinterConfigRepository(initialPrinterConfig);
    this.userRepo = new FileUserRepository();

    // 3. Instantiate Security Services
    this.rateLimiter = new RateLimiter(5, 180, 300); // 5 attempts, 180s lockout
    this.auditLogger = new AuditLogger();
    this.paymentSecurity = new PaymentSecurityService();

    // 4. Instantiate Domain Services (Business Logic Layer)
    this.notificationService = new EventNotificationService();
    this.inventoryService = new InventoryService(
      this.productRepo,
      this.stockMovementRepo,
      this.notificationService
    );
    this.billingService = new BillingService();
    this.orderService = new OrderService(
      this.tableRepo,
      this.orderRepo,
      this.inventoryService,
      this.billingService,
      this.printerRepo,
      this.notificationService,
      this.paymentSecurity,
      this.auditLogger
    );
    this.reportService = new ReportService(this.orderRepo, this.productRepo);
    this.authService = new AuthService(this.userRepo, this.rateLimiter, this.auditLogger);

    // 5. Middlewares
    this.authMiddleware = createAuthMiddleware(this.authService, this.auditLogger);

    // 6. Instantiate Presentation Controllers (Transport Layer)
    this.authController = new AuthController(this.authService);
    this.tableController = new TableController(this.orderService);
    this.productController = new ProductController(this.inventoryService);
    this.reportController = new ReportController(this.reportService);
    this.printerController = new PrinterController(this.printerRepo, this.notificationService);
    this.securityController = new SecurityController(
      this.auditLogger, 
      this.paymentSecurity, 
      this.printerRepo
    );
  }

  getSnapshotState() {
    return {
      tables: this.tableRepo.findAll(),
      products: this.productRepo.findAll(),
      activeOrders: this.orderService.getActiveOrders(),
      historyOrders: this.orderService.getHistoryOrders(50),
      stockMovements: this.stockMovementRepo.findAll().slice(-100),
      printerConfig: this.printerRepo.getConfig()
    };
  }
}
