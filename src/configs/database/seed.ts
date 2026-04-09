import models from '@models';
import * as bcrypt from 'bcrypt'; // Thêm thư viện mã hóa
import { RoleName, FeatureName, ActionCode, createPermissionCode } from './enum';

async function main() {
  console.log('🚀 Đang làm sạch dữ liệu cũ...');
  // Xóa theo thứ tự để tránh lỗi Foreign Key
  await models.userRole.deleteMany();
  await models.rolePermission.deleteMany();
  await models.permission.deleteMany();
  await models.feature.deleteMany();
  await models.role.deleteMany();
  await models.branchInventory.deleteMany();
  await models.recipe.deleteMany();
  await models.product.deleteMany();
  await models.ingredient.deleteMany();
  await models.branch.deleteMany();
  await models.user.deleteMany();

  console.log('🌱 Đang bắt đầu seed dữ liệu mới...');

  // --- 1. MÃ HÓA MẬT KHẨU ---
  const saltRounds = 10;
  const rawPassword = 'Abcd@1234';
  const hashedAdminPassword = await bcrypt.hash(rawPassword, saltRounds);

  // --- 2. SEED ROLE & PERMISSIONS ---
  const adminRole = await models.role.create({
    data: { name: RoleName.ADMIN, description: 'Quản trị viên toàn hệ thống' },
  });

  // Tạo Feature mẫu
  const featSales = await models.feature.create({
    data: {
      featureName: FeatureName.SALES,
      permissions: {
        create: [
          { 
            actionCode: createPermissionCode(FeatureName.SALES, ActionCode.CREATE), 
            description: 'Tạo đơn hàng' 
          },
        ],
      },
    },
  });

  // Gán tất cả quyền hiện có cho Admin
  const allPermissions = await models.permission.findMany();
  await models.rolePermission.createMany({
    data: allPermissions.map((p: any) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });

  // --- 3. SEED BRANCH ---
  const mainBranch = await models.branch.create({
    data: { 
      name: 'VizEnterprise Headquarter', 
      address: 'Da Nang, Vietnam', 
      city: 'Da Nang' 
    }
  });

  // --- 4. SEED USER ADMIN THEO YÊU CẦU ---
  const userAdmin = await models.user.create({
    data: {
      fullName: 'Admin',
      email: 'admin@example.com',
      passwordHash: hashedAdminPassword, // Đã được băm an toàn
      branchId: mainBranch.id
    }
  });

  // Gán Role cho Admin
  await models.userRole.create({
    data: { userId: userAdmin.id, roleId: adminRole.id }
  });

  console.log('-----------------------------------');
  console.log('✅ Seed dữ liệu thành công!');
  console.log(`👤 User: admin@example.com`);
  console.log(`🔑 Pass: ${rawPassword} (Hashed in DB)`);
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await models.$disconnect();
  });